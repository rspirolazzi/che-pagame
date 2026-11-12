import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { Menu } from "react-native-paper";

import { AppButton } from "./AppButton";
import { currencyOptions } from "../utils/currencies";

interface CurrencyPickerProps {
  label: string;
  value: string | null;
  onChange: (code: string) => void;
}

export function CurrencyPicker({ label, value, onChange }: CurrencyPickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const options = useMemo(() => currencyOptions(i18n.language), [i18n.language]);
  const selected = options.find((option) => option.code === value);

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <AppButton mode="outlined" accessibilityLabel={label} onPress={() => setOpen(true)}>
          {selected ? selected.label : t("onboarding.placeholder")}
        </AppButton>
      }
    >
      <ScrollView style={{ maxHeight: 360 }}>
        {options.map((option) => (
          <Menu.Item
            key={option.code}
            title={option.label}
            onPress={() => {
              onChange(option.code);
              setOpen(false);
            }}
          />
        ))}
      </ScrollView>
    </Menu>
  );
}
