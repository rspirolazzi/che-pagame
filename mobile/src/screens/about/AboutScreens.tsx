import { type Href, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { List, Text } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";

import { ContactForm } from "./ContactForm";

/** Question ids per group, in display order: the same list as the web's FaqList (feature 011). */
export const FAQ_GROUPS = {
  basics: ["what", "free", "app"],
  accounts: ["create", "invite", "currency"],
  expenses: ["split", "cents", "who"],
  balances: ["owes", "settle", "income", "close"],
  privacy: ["data", "export", "delete"],
} as const;

type FaqGroup = keyof typeof FAQ_GROUPS;

const SECTIONS: { key: string; route: Href; icon: string }[] = [
  { key: "pages.howItWorks.title", route: "/about/how-it-works", icon: "lightbulb-on-outline" },
  { key: "pages.about.title", route: "/about/who-we-are", icon: "account-group-outline" },
  { key: "pages.contact.title", route: "/about/contact", icon: "email-outline" },
  { key: "pages.faq.title", route: "/about/faq", icon: "help-circle-outline" },
];

function Title({ children }: { children: string }) {
  return (
    <Text variant="headlineSmall" accessibilityRole="header">
      {children}
    </Text>
  );
}

function Subtitle({ children }: { children: string }) {
  return (
    <Text variant="titleMedium" accessibilityRole="header">
      {children}
    </Text>
  );
}

/** Profile → "Acerca de": the four information pages of the web (feature 011, US4). */
export function AboutMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen withTopInset={false}>
      <Title>{t("profile.about")}</Title>
      <View>
        {SECTIONS.map(({ key, route, icon }) => (
          <List.Item
            key={key}
            title={t(key)}
            left={(props) => <List.Icon {...props} icon={icon} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push(route)}
            accessibilityRole="button"
          />
        ))}
      </View>
    </Screen>
  );
}

const STEPS = ["create", "add", "balances", "settle"] as const;
const USES = ["trip", "bbq", "flat", "couple"] as const;

export function HowItWorksScreen() {
  const { t } = useTranslation();
  return (
    <Screen withTopInset={false}>
      <Title>{t("pages.howItWorks.title")}</Title>
      <Text>{t("pages.howItWorks.intro")}</Text>
      <Subtitle>{t("pages.howItWorks.stepsTitle")}</Subtitle>
      {STEPS.map((key, index) => (
        <View key={key}>
          <Text variant="titleSmall">{`${index + 1}. ${t(`pages.howItWorks.steps.${key}.title`)}`}</Text>
          <Text>{t(`pages.howItWorks.steps.${key}.body`)}</Text>
        </View>
      ))}
      <Subtitle>{t("pages.howItWorks.usesTitle")}</Subtitle>
      {USES.map((key) => (
        <View key={key}>
          <Text variant="titleSmall">{t(`pages.howItWorks.uses.${key}.title`)}</Text>
          <Text>{t(`pages.howItWorks.uses.${key}.body`)}</Text>
        </View>
      ))}
    </Screen>
  );
}

export function WhoWeAreScreen() {
  const { t } = useTranslation();
  return (
    <Screen withTopInset={false}>
      <Title>{t("pages.about.title")}</Title>
      <Subtitle>{t("pages.about.whatTitle")}</Subtitle>
      <Text>{t("pages.about.body")}</Text>
      <Subtitle>{t("pages.about.whyTitle")}</Subtitle>
      <Text>{t("pages.about.why")}</Text>
      <Subtitle>{t("pages.about.privacyTitle")}</Subtitle>
      <Text>{t("pages.about.privacy")}</Text>
    </Screen>
  );
}

/** The contact page of the web, where the contact channel lives. */
export function ContactScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen withTopInset={false}>
      <Title>{t("pages.contact.title")}</Title>
      <Text>{t("pages.contact.intro")}</Text>
      {/* The form of feature 017; the web page stays as an alternative. */}
      <ContactForm />
      <Text>{t("pages.contact.faq")}</Text>
      <AppButton mode="outlined" onPress={() => router.push("/about/faq")}>
        {t("pages.faq.title")}
      </AppButton>
    </Screen>
  );
}

export function FaqScreen() {
  const { t } = useTranslation();
  return (
    <Screen withTopInset={false}>
      <Title>{t("pages.faq.title")}</Title>
      <Text>{t("pages.faq.intro")}</Text>
      {(Object.keys(FAQ_GROUPS) as FaqGroup[]).map((group) => (
        <List.Section key={group}>
          <Subtitle>{t(`pages.faq.groups.${group}.title`)}</Subtitle>
          {FAQ_GROUPS[group].map((id) => (
            <List.Accordion
              key={id}
              title={t(`pages.faq.groups.${group}.items.${id}.q`)}
              titleNumberOfLines={3}
            >
              <Text style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                {t(`pages.faq.groups.${group}.items.${id}.a`)}
              </Text>
            </List.Accordion>
          ))}
        </List.Section>
      ))}
    </Screen>
  );
}
