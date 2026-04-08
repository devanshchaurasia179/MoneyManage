import React from "react";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { getCatMeta } from "./types";

export function CatIcon({
  category,
  size,
  color,
}: {
  category: string;
  size: number;
  color?: string;
}) {
  const meta = getCatMeta(category);
  const c = color ?? meta.color;
  if (meta.lib === "Ionicons")
    return <Ionicons name={meta.icon as any} size={size} color={c} />;
  if (meta.lib === "FontAwesome5")
    return <FontAwesome5 name={meta.icon as any} size={size} color={c} />;
  return <MaterialCommunityIcons name={meta.icon as any} size={size} color={c} />;
}
