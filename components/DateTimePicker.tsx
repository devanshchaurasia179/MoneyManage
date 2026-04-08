import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from "react-native";
import { IconCalendar, IconClock, IconClose } from "./Icons";
import { useTheme } from "../context/ThemeContext";

type Props = { value: Date; onChange: (date: Date) => void };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const pad = (n: number) => String(n).padStart(2, "0");
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
type PickerType = "date" | "time" | null;

export const DateTimePicker = ({ value, onChange }: Props) => {
  const { isDark } = useTheme();
  const C = isDark ? {
    btnBg: "#0a140d", btnBorder: "#1a3320", btnText: "#e5e7eb",
    overlay: "rgba(0,0,0,0.78)",
    sheetBg: "#0f1b12", sheetBorder: "#1a3320",
    headerTitle: "#e5e7eb",
    closeBg: "#0a140d", closeBorder: "#1a3320",
    colLabel: "#6b7280", colBg: "#0a140d", colBorder: "#1a3320",
    itemBorder: "#1a2a1e", itemActiveBg: "#0d2214",
    itemText: "#9ca3af", itemTextActive: "#2CCE71",
    confirmBg: "#16a34a",
  } : {
    btnBg: "#f8fafc", btnBorder: "#e2e8f0", btnText: "#0f172a",
    overlay: "rgba(0,0,0,0.5)",
    sheetBg: "#ffffff", sheetBorder: "#e2e8f0",
    headerTitle: "#0f172a",
    closeBg: "#f1f5f9", closeBorder: "#e2e8f0",
    colLabel: "#94a3b8", colBg: "#f8fafc", colBorder: "#e2e8f0",
    itemBorder: "#f1f5f9", itemActiveBg: "#f0fdf4",
    itemText: "#64748b", itemTextActive: "#16a34a",
    confirmBg: "#16a34a",
  };

  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [tempYear, setTempYear] = useState(value.getFullYear());
  const [tempMonth, setTempMonth] = useState(value.getMonth());
  const [tempDay, setTempDay] = useState(value.getDate());
  const [tempHour, setTempHour] = useState(value.getHours() % 12 === 0 ? 12 : value.getHours() % 12);
  const [tempMin, setTempMin] = useState(value.getMinutes());
  const [tempAmPm, setTempAmPm] = useState(value.getHours() >= 12 ? "PM" : "AM");

  const openPicker = (type: PickerType) => {
    setTempYear(value.getFullYear()); setTempMonth(value.getMonth()); setTempDay(value.getDate());
    const h = value.getHours();
    setTempHour(h % 12 === 0 ? 12 : h % 12); setTempMin(value.getMinutes()); setTempAmPm(h >= 12 ? "PM" : "AM");
    setPickerType(type);
  };

  const confirmDate = () => {
    const safeDay = Math.min(tempDay, getDaysInMonth(tempYear, tempMonth));
    const d = new Date(value); d.setFullYear(tempYear); d.setMonth(tempMonth); d.setDate(safeDay);
    onChange(d); setPickerType(null);
  };

  const confirmTime = () => {
    const d = new Date(value);
    let h = tempHour % 12; if (tempAmPm === "PM") h += 12;
    d.setHours(h); d.setMinutes(tempMin); onChange(d); setPickerType(null);
  };

  const dateLabel = `${FULL_MONTHS[value.getMonth()]} ${value.getDate()}, ${value.getFullYear()}`;
  const timeLabel = `${pad(value.getHours() % 12 === 0 ? 12 : value.getHours() % 12)}:${pad(value.getMinutes())} ${value.getHours() >= 12 ? "PM" : "AM"}`;

  const PickerModal = ({ type }: { type: "date" | "time" }) => {
    const columns = type === "date"
      ? [
          { label: "Month", data: MONTHS.map((m, i) => ({ val: i, display: m })), selected: tempMonth, onSelect: setTempMonth },
          { label: "Day", data: range(1, getDaysInMonth(tempYear, tempMonth)).map((d) => ({ val: d, display: String(d) })), selected: tempDay, onSelect: setTempDay },
          { label: "Year", data: range(2000, new Date().getFullYear() + 1).reverse().map((y) => ({ val: y, display: String(y) })), selected: tempYear, onSelect: setTempYear },
        ]
      : [
          { label: "Hour", data: range(1, 12).map((h) => ({ val: h, display: pad(h) })), selected: tempHour, onSelect: setTempHour },
          { label: "Min", data: range(0, 59).map((m) => ({ val: m, display: pad(m) })), selected: tempMin, onSelect: setTempMin },
          { label: "AM/PM", data: [{ val: "AM", display: "AM" }, { val: "PM", display: "PM" }] as any, selected: tempAmPm, onSelect: setTempAmPm as any },
        ];

    return (
      <Modal visible={pickerType === type} transparent animationType="slide">
        <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: C.sheetBg, borderColor: C.sheetBorder }]}>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: C.headerTitle }]}>Select {type === "date" ? "Date" : "Time"}</Text>
              <TouchableOpacity onPress={() => setPickerType(null)} style={[styles.closeBtn, { backgroundColor: C.closeBg, borderColor: C.closeBorder }]}>
                <IconClose size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.columnsRow}>
              {columns.map((col) => (
                <View key={col.label} style={styles.colWrap}>
                  <Text style={[styles.colLabel, { color: C.colLabel }]}>{col.label}</Text>
                  <ScrollView style={[styles.col, { backgroundColor: C.colBg, borderColor: C.colBorder }]} showsVerticalScrollIndicator={false}>
                    {col.data.map((item: any) => (
                      <TouchableOpacity
                        key={item.val}
                        style={[styles.colItem, { borderBottomColor: C.itemBorder }, col.selected === item.val && { backgroundColor: C.itemActiveBg }]}
                        onPress={() => col.onSelect(item.val)}
                      >
                        <Text style={[styles.colItemText, { color: C.itemText }, col.selected === item.val && { color: C.itemTextActive, fontWeight: "700" }]}>
                          {item.display}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: C.confirmBg }]} onPress={type === "date" ? confirmDate : confirmTime}>
              <Text style={styles.confirmBtnText}>Confirm {type === "date" ? "Date" : "Time"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.pickerBtn, { flex: 1, marginRight: 6, backgroundColor: C.btnBg, borderColor: C.btnBorder }]} onPress={() => openPicker("date")}>
          <IconCalendar size={15} color={isDark ? "#2CCE71" : "#16a34a"} />
          <Text style={[styles.pickerBtnText, { color: C.btnText }]}>{dateLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pickerBtn, { flex: 0.6, backgroundColor: C.btnBg, borderColor: C.btnBorder }]} onPress={() => openPicker("time")}>
          <IconClock size={15} color={isDark ? "#2CCE71" : "#16a34a"} />
          <Text style={[styles.pickerBtnText, { color: C.btnText }]}>{timeLabel}</Text>
        </TouchableOpacity>
      </View>
      <PickerModal type="date" />
      <PickerModal type="time" />
    </>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 10 },
  pickerBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  pickerBtnText: { fontSize: 13, flex: 1 },
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderTopWidth: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  closeBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  columnsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  colWrap: { flex: 1 },
  colLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 8, textAlign: "center" },
  col: { maxHeight: 200, borderRadius: 10, borderWidth: 1 },
  colItem: { paddingVertical: 10, alignItems: "center", borderBottomWidth: 0.5 },
  colItemText: { fontSize: 15 },
  confirmBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});