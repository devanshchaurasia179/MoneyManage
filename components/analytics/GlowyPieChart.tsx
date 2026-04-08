import React from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
import Svg, {
  Path,
  Circle,
  G,
  Text as SvgText,
  Defs,
  RadialGradient,
  Stop,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
} from "react-native-svg";
import { Colors, CategoryStat, fmt } from "./types";

const { width: SW } = Dimensions.get("window");

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Arc path for a donut (annular) slice
function donutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const gap = 2.5;
  const sa = startAngle + gap / 2;
  const ea = endAngle - gap / 2;
  if (ea - sa <= 0) return "";

  const outerStart = polarToCartesian(cx, cy, outerR, sa);
  const outerEnd = polarToCartesian(cx, cy, outerR, ea);
  const innerStart = polarToCartesian(cx, cy, innerR, ea);
  const innerEnd = polarToCartesian(cx, cy, innerR, sa);
  const large = ea - sa > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

// Glow arc path slightly larger for the blur layer
function glowArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const gap = 1.5;
  const sa = startAngle + gap / 2;
  const ea = endAngle - gap / 2;
  if (ea - sa <= 0) return "";

  const glowOuter = outerR + 4;
  const glowInner = innerR - 2;

  const outerStart = polarToCartesian(cx, cy, glowOuter, sa);
  const outerEnd = polarToCartesian(cx, cy, glowOuter, ea);
  const innerStart = polarToCartesian(cx, cy, glowInner, ea);
  const innerEnd = polarToCartesian(cx, cy, glowInner, sa);
  const large = ea - sa > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${glowOuter} ${glowOuter} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${glowInner} ${glowInner} 0 ${large} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

interface PieChartProps {
  stats: CategoryStat[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
  C: Colors;
  currency: string;
  totalExpense: number;
}

export function GlowyPieChart({
  stats,
  selected,
  onSelect,
  C,
  currency,
  totalExpense,
}: PieChartProps) {
  const size = SW - 32;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.4;
  const innerR = outerR * 0.68; // thin donut ring

  const selectedStat = stats.find((s) => s.category === selected);

  return (
    <View style={{ alignItems: "center" }}>
      <TouchableOpacity activeOpacity={1} style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Defs>
            {/* Radial gradient for inner glow background */}
            <RadialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
              <Stop
                offset="0%"
                stopColor={C.isDark ? "#1a2235" : "#f0f4f8"}
                stopOpacity="1"
              />
              <Stop offset="100%" stopColor={C.card} stopOpacity="1" />
            </RadialGradient>

            {/* Per-category glow filters */}
            {stats.map((s) => (
              <Filter
                key={`filter-${s.category}`}
                id={`glow-${s.category.replace(/\s/g, "")}`}
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <FeGaussianBlur stdDeviation="5" result="blur" />
                <FeMerge>
                  <FeMergeNode in="blur" />
                  <FeMergeNode in="blur" />
                  <FeMergeNode in="SourceGraphic" />
                </FeMerge>
              </Filter>
            ))}

            {/* Selected slice stronger glow */}
            <Filter
              id="glowSelected"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <FeGaussianBlur stdDeviation="9" result="blur" />
              <FeMerge>
                <FeMergeNode in="blur" />
                <FeMergeNode in="blur" />
                <FeMergeNode in="blur" />
                <FeMergeNode in="SourceGraphic" />
              </FeMerge>
            </Filter>
          </Defs>

          {/* Dark background circle */}
          <Circle
            cx={cx}
            cy={cy}
            r={outerR + 16}
            fill={C.isDark ? "#121827" : "#f5f5f5"}
            opacity={0.6}
          />

          {/* Actual thin donut slices */}
          {stats.map((s) => {
            const isSel = selected === s.category;
            const midAngle = (s.startAngle + s.endAngle) / 2;
            const rad = ((midAngle - 90) * Math.PI) / 180;
            const shift = isSel ? 8 : 0;
            return (
              <G
                key={`slice-${s.category}`}
                translateX={shift * Math.cos(rad)}
                translateY={shift * Math.sin(rad)}
                onPress={() => onSelect(isSel ? null : s.category)}
              >
                <Path
                  d={donutArcPath(
                    cx,
                    cy,
                    outerR,
                    innerR,
                    s.startAngle,
                    s.endAngle
                  )}
                  fill={s.color}
                  opacity={selected && !isSel ? 0.25 : 1}
                />
              </G>
            );
          })}

          {/* Invisible hit areas (larger, for easier touch) */}
          {stats.map((s) => (
            <G
              key={`hit-${s.category}`}
              onPress={() =>
                onSelect(selected === s.category ? null : s.category)
              }
            >
              <Path
                d={donutArcPath(
                  cx,
                  cy,
                  outerR + 18,
                  innerR - 14,
                  s.startAngle,
                  s.endAngle
                )}
                fill="transparent"
              />
            </G>
          ))}

          {/* Center background */}
          <Circle cx={cx} cy={cy} r={innerR - 3} fill="url(#innerGlow)" />

          {/* Center text */}
          {selectedStat ? (
            <G>
              <SvgText
                x={cx}
                y={cy - 35}
                textAnchor="middle"
                fill={selectedStat.color}
                fontSize={11}
                fontWeight="700"
                letterSpacing="0.8"
              >
                {selectedStat.category.toUpperCase()}
              </SvgText>
              <SvgText
                x={cx}
                y={cy + 5}
                textAnchor="middle"
                fill={C.text}
                fontSize={22}
                fontWeight="800"
                letterSpacing="-0.5"
              >
                {fmt(selectedStat.total, currency)}
              </SvgText>
              <SvgText
                x={cx}
                y={cy + 26}
                textAnchor="middle"
                fill={selectedStat.color}
                fontSize={12}
                fontWeight="600"
                opacity={0.85}
              >
                {selectedStat.percent.toFixed(1)}%
              </SvgText>
              <SvgText
                x={cx}
                y={cy + 45}
                textAnchor="middle"
                fill={C.textSec}
                fontSize={10}
              >
                {selectedStat.count} transactions
              </SvgText>
            </G>
          ) : (
            <G>
              <SvgText
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                fill={C.textSec}
                fontSize={10}
                fontWeight="700"
                letterSpacing="1.2"
              >
                TOTAL SPENT
              </SvgText>
              <SvgText
                x={cx}
                y={cy + 22}
                textAnchor="middle"
                fill={C.text}
                fontSize={26}
                fontWeight="800"
                letterSpacing="-0.8"
              >
                {fmt(totalExpense, currency)}
              </SvgText>
            </G>
          )}
        </Svg>
      </TouchableOpacity>
    </View>
  );
}