import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Share, View } from "react-native";
import { Divider, List, Text, TextInput, useTheme } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AccountIcon, ConfirmDialog, IconPicker } from "../../components/accounts/AccountBits";
import { ErrorText, formStyles } from "../../components/FormBits";
import { StatusNotice } from "../../components/StatusNotice";
import { accountsApi } from "../../services/api/accounts";
import { expensesApi } from "../../services/api/expenses";
import {
  type AccountIcon as Icon,
  type AccountResponse,
  type ApiErrorCode,
  errorCodeOf,
  type ParticipantResponse,
} from "../../services/api/types";
import {
  ACCOUNT_NAME_MAX,
  isValidAccountName,
  isValidParticipantName,
  PARTICIPANT_NAME_MAX,
  webInviteUrl,
} from "../../utils/accountIcons";

type Dialog =
  | { kind: "remove"; participant: ParticipantResponse; affected: number | null }
  | { kind: "leave" | "close" | "delete" | "regenerate" }
  | null;

export default function AccountDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<Icon>("group");
  const [newParticipant, setNewParticipant] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [saved, setSaved] = useState(false);

  function show(next: AccountResponse) {
    setAccount(next);
    setName(next.name);
    setDescription(next.description ?? "");
    setIcon(next.icon);
  }

  useEffect(() => {
    accountsApi
      .get(accountId)
      .then(show)
      .catch((err) => setError(errorCodeOf(err)));
  }, [accountId]);

  async function run(action: () => Promise<AccountResponse | void>, after?: () => void) {
    setError(null);
    setSaved(false);
    try {
      const result = await action();
      if (result) show(result);
      after?.();
      return true;
    } catch (err) {
      const code = errorCodeOf(err);
      if (code === "not_found") router.replace("/accounts");
      else setError(code);
      return false;
    }
  }

  if (!account) {
    return (
      <ScrollView contentContainerStyle={formStyles.screen}>
        <ErrorText code={error} />
      </ScrollView>
    );
  }

  const readOnly = account.isClosed;
  const goToList = () => router.replace("/accounts");

  async function confirmDialog() {
    const current = dialog;
    setDialog(null);
    if (!current || !account) return;
    if (current.kind === "remove") {
      await run(() => accountsApi.removeParticipant(account.id, current.participant.id));
    } else if (current.kind === "leave") {
      await run(() => accountsApi.leave(account.id), goToList);
    } else if (current.kind === "close") {
      await run(() => accountsApi.close(account.id));
    } else if (current.kind === "delete") {
      await run(() => accountsApi.remove(account.id), goToList);
    } else if (current.kind === "regenerate") {
      await run(() => accountsApi.regenerateInviteCode(account.id));
    }
  }

  // How many expenses the removal changes (FR-022); null if it could not be counted.
  function removeImpactText(): string {
    if (dialog?.kind !== "remove") return "";
    const { affected } = dialog;
    if (affected === null) return t("accounts.dialogs.removeImpactUnknown");
    if (affected === 0) return t("accounts.dialogs.removeImpact_zero");
    return t("accounts.dialogs.removeImpact", { count: affected });
  }

  async function askRemove(participant: ParticipantResponse) {
    if (!account) return;
    const affected = await expensesApi
      .participantImpact(account.id, participant.id)
      .then((impact) => impact.affectedExpenses)
      .catch(() => null);
    setDialog({ kind: "remove", participant, affected });
  }

  const dialogText: Record<string, [string, string]> = {
    remove: [
      t("accounts.dialogs.removeTitle", {
        name: dialog?.kind === "remove" ? dialog.participant.name : "",
      }),
      `${t("accounts.dialogs.removeBody")} ${removeImpactText()}`,
    ],
    leave: [t("accounts.dialogs.leaveTitle"), t("accounts.dialogs.leaveBody")],
    close: [t("accounts.dialogs.closeTitle"), t("accounts.dialogs.closeBody")],
    delete: [t("accounts.dialogs.deleteTitle"), t("accounts.dialogs.deleteBody")],
    regenerate: [t("accounts.dialogs.regenerateTitle"), t("accounts.dialogs.regenerateBody")],
  };

  return (
    <ScrollView contentContainerStyle={formStyles.screen} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <AccountIcon icon={account.icon} size={36} />
        <View>
          <Text variant="headlineSmall">{account.name}</Text>
          <Text>{t("accounts.detail.currency", { currency: account.currency })}</Text>
        </View>
      </View>
      {account.description ? <Text>{account.description}</Text> : null}
      {readOnly && <StatusNotice kind="readOnly">{t("accounts.detail.closedNotice")}</StatusNotice>}

      <Divider />
      <Text variant="titleMedium">{t("accounts.detail.participants")}</Text>
      {account.participants.map((p) =>
        renaming?.id === p.id ? (
          <View key={p.id} style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={{ flex: 1 }}
              mode="outlined"
              accessibilityLabel={t("accounts.detail.rename")}
              maxLength={PARTICIPANT_NAME_MAX}
              value={renaming.name}
              onChangeText={(text) => setRenaming({ id: p.id, name: text })}
            />
            <AppButton
              onPress={() =>
                isValidParticipantName(renaming.name) &&
                run(
                  () => accountsApi.renameParticipant(account.id, p.id, renaming.name.trim()),
                  () => setRenaming(null),
                )
              }
            >
              {t("accounts.form.save")}
            </AppButton>
          </View>
        ) : (
          <List.Item
            key={p.id}
            title={p.name}
            // A deleted user's participant reads differently (feature 015).
            titleStyle={p.isAnonymized ? { fontStyle: "italic" } : undefined}
            description={[
              p.isMe ? t("accounts.detail.you") : null,
              p.isOwner ? t("accounts.detail.owner") : null,
              p.isLinked && !p.isMe ? t("accounts.detail.linked") : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            right={() =>
              readOnly ? null : (
                <View style={{ flexDirection: "row" }}>
                  <AppButton compact onPress={() => setRenaming({ id: p.id, name: p.name })}>
                    {t("accounts.detail.rename")}
                  </AppButton>
                  {!p.isOwner && (
                    <AppButton compact onPress={() => askRemove(p)}>
                      {t("accounts.detail.remove")}
                    </AppButton>
                  )}
                </View>
              )
            }
          />
        ),
      )}
      {!readOnly && (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={{ flex: 1 }}
            mode="outlined"
            label={t("accounts.form.addParticipant")}
            accessibilityLabel={t("accounts.form.addParticipant")}
            maxLength={PARTICIPANT_NAME_MAX}
            value={newParticipant}
            onChangeText={setNewParticipant}
          />
          <AppButton
            onPress={() =>
              isValidParticipantName(newParticipant) &&
              run(
                () => accountsApi.addParticipant(account.id, newParticipant.trim()),
                () => setNewParticipant(""),
              )
            }
          >
            {t("accounts.detail.add")}
          </AppButton>
        </View>
      )}

      {!readOnly && (
        <>
          <Divider />
          <Text variant="titleMedium">{t("accounts.invite.title")}</Text>
          <Text>{t("accounts.invite.hint")}</Text>
          <Text selectable>{t("accounts.invite.code", { code: account.inviteCode })}</Text>
          <AppButton
            mode="outlined"
            onPress={() => Share.share({ message: webInviteUrl(account.inviteCode) })}
          >
            {t("accounts.invite.share")}
          </AppButton>
          {account.isOwner && (
            <AppButton mode="text" onPress={() => setDialog({ kind: "regenerate" })}>
              {t("accounts.invite.regenerate")}
            </AppButton>
          )}

          <Divider />
          <Text variant="titleMedium">{t("accounts.detail.edit")}</Text>
          <TextInput
            mode="outlined"
            label={t("accounts.form.name")}
            accessibilityLabel={t("accounts.form.name")}
            maxLength={ACCOUNT_NAME_MAX}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            mode="outlined"
            label={t("accounts.form.description")}
            accessibilityLabel={t("accounts.form.description")}
            multiline
            maxLength={500}
            value={description}
            onChangeText={setDescription}
          />
          <IconPicker value={icon} onChange={setIcon} />
          <AppButton
            mode="contained"
            onPress={() =>
              isValidAccountName(name) &&
              run(
                () =>
                  accountsApi.update(account.id, {
                    name: name.trim(),
                    description: description.trim() || null,
                    icon,
                  }),
                () => setSaved(true),
              )
            }
          >
            {t("accounts.form.save")}
          </AppButton>
          {saved && <Text>{t("accounts.form.saved")}</Text>}
        </>
      )}
      <ErrorText code={error} />

      <Divider />
      {!account.isOwner && !readOnly && (
        <AppButton mode="outlined" onPress={() => setDialog({ kind: "leave" })}>
          {t("accounts.actions.leave")}
        </AppButton>
      )}
      {account.isOwner && !readOnly && (
        <AppButton mode="outlined" onPress={() => setDialog({ kind: "close" })}>
          {t("accounts.actions.close")}
        </AppButton>
      )}
      {account.isOwner && (
        <AppButton
          mode="text"
          textColor={theme.colors.error}
          onPress={() => setDialog({ kind: "delete" })}
        >
          {t("accounts.actions.delete")}
        </AppButton>
      )}

      <ConfirmDialog
        visible={dialog !== null}
        title={dialog ? dialogText[dialog.kind][0] : ""}
        message={dialog ? dialogText[dialog.kind][1] : ""}
        onCancel={() => setDialog(null)}
        onConfirm={confirmDialog}
      />
    </ScrollView>
  );
}
