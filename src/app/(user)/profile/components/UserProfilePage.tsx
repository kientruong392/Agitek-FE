"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { CalendarDays, Camera, Check, KeyRound, MapPin, Plus, Save, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { changeMyPassword, createAddress, deleteAddress, updateAddress, updateMyAccount, updateMyProfile } from "@/actions/profile.action";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { cn } from "cn";
import type { Address, CreateAddressInput, GenderType, UpdateAddressInput, UserDTO, UserProfile } from "@/types/model.types";
import AddressDialog from "./AddressDialog";

type Props = { account: UserDTO; profile: UserProfile; addresses: Address[] };
type ProfileTabProps = {
  tabs: { value: string; label: React.ReactNode }[];
  t: ReturnType<typeof useTranslations>;
  account: UserDTO;
  username: string;
  setUsername: (value: string) => void;
  busy: boolean;
  saveAccount: (event: React.FormEvent<HTMLFormElement>) => void;
  onPasswordOpen: () => void;
  fullName: string;
  setFullName: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  gender: GenderType | null;
  setGender: (value: GenderType | null) => void;
  dateOfBirth?: Date;
  setDateOfBirth: (value: Date) => void;
  avatarUrl: string;
  avatarBusy: boolean;
  uploadAvatar: (event: React.ChangeEvent<HTMLInputElement>) => void;
  saveProfile: (event: React.FormEvent<HTMLFormElement>) => void;
  addresses: Address[];
  onAddAddress: () => void;
  onEditAddress: (address: Address) => void;
  onSetDefault: (address: Address) => void;
  onDeleteAddress: (address: Address) => void;
};

export default function UserProfilePage({ account: initialAccount, profile: initialProfile, addresses: initialAddresses }: Props) {
  const t = useTranslations("UserProfile");
  const router = useRouter();
  const [account, setAccount] = useState(initialAccount);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [username, setUsername] = useState(initialAccount.username);
  const [fullName, setFullName] = useState(initialProfile.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialProfile.phoneNumber ?? "");
  const [gender, setGender] = useState<GenderType | null>(initialProfile.gender ?? null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(initialProfile.dateOfBirth ? new Date(initialProfile.dateOfBirth) : undefined);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl ?? "");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const tabs = useMemo(() => [
    { value: "account", label: <span className="inline-flex items-center gap-2"><UserRound className="size-4" />{t("accountTab")}</span> },
    { value: "profile", label: <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4" />{t("profileTab")}</span> },
    { value: "addresses", label: <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{t("addressesTab")}</span> },
  ], [t]);

  const saveAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const response = await updateMyAccount({ username: username.trim() });
    setBusy(false);
    if (!response.success || !response.data) { toast.add({ title: response.message || t("saveError"), type: "error" }); return; }
    setAccount(response.data); setUsername(response.data.username); toast.add({ title: t("accountSaved"), type: "success" });
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const response = await updateMyProfile(account.id, {
      fullName: fullName.trim(), phoneNumber: phoneNumber.trim() || undefined, avatarUrl: avatarUrl || undefined,
      gender, dateOfBirth: dateOfBirth?.toISOString() ?? null,
    });
    setBusy(false);
    if (!response.success || !response.data) { toast.add({ title: response.message || t("saveError"), type: "error" }); return; }
    setFullName(response.data.fullName); setPhoneNumber(response.data.phoneNumber ?? ""); setGender(response.data.gender ?? null); setDateOfBirth(response.data.dateOfBirth ? new Date(response.data.dateOfBirth) : undefined); setAvatarUrl(response.data.avatarUrl ?? "");
    toast.add({ title: t("profileSaved"), type: "success" }); router.refresh();
  };

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { toast.add({ title: t("passwordMismatch"), type: "error" }); return; }
    setBusy(true);
    const response = await changeMyPassword({ oldPassword, newPassword });
    setBusy(false);
    if (!response.success) { toast.add({ title: response.message || t("saveError"), type: "error" }); return; }
    setPasswordOpen(false); setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    toast.add({ title: t("passwordSaved"), type: "success" });
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.add({ title: t("invalidImage"), type: "error" }); event.currentTarget.value = ""; return; }
    setAvatarBusy(true);
    const response = await uploadImageToCloudinary(file, "agitek/avatars");
    setAvatarBusy(false);
    event.currentTarget.value = "";
    if (!response.success || !response.data?.secure_url) { toast.add({ title: response.message || t("uploadError"), type: "error" }); return; }
    setAvatarUrl(response.data.secure_url);
    toast.add({ title: t("profileSaved"), type: "success" });
  };

  const submitAddress = async (input: CreateAddressInput | UpdateAddressInput) => {
    setBusy(true);
    const response = editingAddress
      ? await updateAddress(editingAddress.id, input as UpdateAddressInput)
      : await createAddress(input as CreateAddressInput);
    setBusy(false);
    if (!response.success || !response.data) { toast.add({ title: response.message || t("saveError"), type: "error" }); return; }
    const savedAddress = response.data;
    setAddresses((current) => {
      const next = editingAddress ? current.map((address) => address.id === savedAddress.id ? savedAddress : address) : [...current, savedAddress];
      if (savedAddress.isDefault) return next.map((address) => ({ ...address, isDefault: address.id === savedAddress.id }));
      return next;
    });
    setAddressDialogOpen(false); setEditingAddress(null); toast.add({ title: t("addressSaved"), type: "success" });
  };

  const setDefaultAddress = async (address: Address) => {
    setBusy(true);
    const response = await updateAddress(address.id, { isDefault: true });
    setBusy(false);
    if (!response.success) { toast.add({ title: response.message || t("saveError"), type: "error" }); return; }
    setAddresses((current) => current.map((item) => ({ ...item, isDefault: item.id === address.id })));
    toast.add({ title: t("defaultUpdated"), type: "success" });
  };

  const removeAddress = async (address: Address) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusy(true);
    const response = await deleteAddress(address.id);
    setBusy(false);
    if (!response.success) { toast.add({ title: response.message || t("saveError"), type: "error" }); return; }
    setAddresses((current) => {
      const next = current.filter((item) => item.id !== address.id);
      if (address.isDefault && next.length) return next.map((item, index) => ({ ...item, isDefault: index === 0 }));
      return next;
    });
    toast.add({ title: t("addressDeleted"), type: "success" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 flex flex-col gap-5 rounded-3xl bg-linear-to-br from-blue-700 to-sky-500 p-6 text-white shadow-lg shadow-blue-950/10 sm:flex-row sm:items-center sm:p-8">
        <Avatar className="size-20 border-4 border-white/30">
          <AvatarImage src={avatarUrl || undefined} alt={fullName || account.username} />
          <AvatarFallback className="bg-white/20 text-xl text-white">{(fullName || account.username).slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-blue-100">{t("welcome")}</p>
          <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">{fullName || account.username}</h1>
          <p className="mt-1 text-sm text-blue-100">{account.email}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm"><ShieldCheck className="size-4" />{t("secureAccount")}</div>
      </div>

      <ProfileTabs
        key={account.id}
        tabs={tabs}
        t={t}
        account={account}
        username={username}
        setUsername={setUsername}
        busy={busy}
        saveAccount={saveAccount}
        onPasswordOpen={() => setPasswordOpen(true)}
        fullName={fullName}
        setFullName={setFullName}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        gender={gender}
        setGender={setGender}
        dateOfBirth={dateOfBirth}
        setDateOfBirth={setDateOfBirth}
        avatarUrl={avatarUrl}
        avatarBusy={avatarBusy}
        uploadAvatar={uploadAvatar}
        saveProfile={saveProfile}
        addresses={addresses}
        onAddAddress={() => { setEditingAddress(null); setAddressDialogOpen(true); }}
        onEditAddress={(address) => { setEditingAddress(address); setAddressDialogOpen(true); }}
        onSetDefault={setDefaultAddress}
        onDeleteAddress={removeAddress}
      />

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("changePassword")}</DialogTitle><DialogDescription>{t("passwordDescription")}</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={savePassword}>
            <PasswordField id="old-password" label={t("oldPassword")} value={oldPassword} onChange={setOldPassword} />
            <PasswordField id="new-password" label={t("newPassword")} value={newPassword} onChange={setNewPassword} />
            <PasswordField id="confirm-password" label={t("confirmPassword")} value={confirmPassword} onChange={setConfirmPassword} />
            <DialogFooter><Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>{t("cancel")}</Button><Button type="submit" disabled={busy}><KeyRound />{t("save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddressDialog
        open={addressDialogOpen}
        address={editingAddress}
        isFirstAddress={!addresses.length}
        isEditingDefault={editingAddress?.isDefault ?? false}
        isSaving={busy}
        title={editingAddress ? t("editAddress") : t("addAddress")}
        description={t("addressDialogDescription")}
        labels={{ receiver: t("receiverName"), phone: t("addressPhone"), line: t("addressLine"), makeDefault: t("makeDefault"), save: t("save"), cancel: t("cancel") }}
        onOpenChange={(open) => { setAddressDialogOpen(open); if (!open) setEditingAddress(null); }}
        onSave={submitAddress}
      />
    </div>
  );
}

function PasswordField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="password" autoComplete="new-password" required minLength={6} maxLength={100} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function ProfileTabs(props: ProfileTabProps) {
  const { tabs, t } = props;
  const [activeTab, setActiveTab] = useState("account");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const locale = useLocale();

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    setActiveTab(tabs[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
      <div role="tablist" aria-orientation="vertical" className="flex gap-2 overflow-x-auto rounded-2xl border bg-card p-2 md:flex-col md:overflow-visible">
        {tabs.map((tab, index) => {
          const selected = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              id={`profile-tab-${tab.value}`}
              ref={(element) => { tabRefs.current[index] = element; }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`profile-panel-${tab.value}`}
              tabIndex={selected ? 0 : -1}
              className={cn("flex shrink-0 items-center rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              onClick={() => setActiveTab(tab.value)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div id={`profile-panel-${activeTab}`} role="tabpanel" aria-labelledby={`profile-tab-${activeTab}`} tabIndex={0} className="min-w-0 focus-visible:outline-none">
      {activeTab === "account" ? <Card>
        <CardHeader><CardTitle>{t("accountTitle")}</CardTitle><CardDescription>{t("accountDescription")}</CardDescription></CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={props.saveAccount}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="profile-username">{t("username")}</Label><Input id="profile-username" minLength={6} maxLength={20} required value={props.username} onChange={(event) => props.setUsername(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="profile-email">{t("email")}</Label><Input id="profile-email" value={props.account.email} disabled /></div>
            </div>
            <div className="flex flex-wrap justify-between gap-3 border-t pt-5">
              <Button type="button" variant="outline" onClick={props.onPasswordOpen}><KeyRound />{t("changePassword")}</Button>
              <Button type="submit" disabled={props.busy}><Save />{t("saveChanges")}</Button>
            </div>
          </form>
        </CardContent>
      </Card> : activeTab === "profile" ? <Card>
        <CardHeader><CardTitle>{t("profileTitle")}</CardTitle><CardDescription>{t("profileDescription")}</CardDescription></CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={props.saveProfile}>
            <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center">
              <Avatar className="size-20 ring-4 ring-blue-100 dark:ring-blue-950"><AvatarImage src={props.avatarUrl || undefined} alt={props.fullName} /><AvatarFallback className="bg-blue-100 text-lg font-semibold text-blue-700">{props.fullName.slice(0, 2).toUpperCase() || "?"}</AvatarFallback></Avatar>
              <div><Label htmlFor="avatar-upload" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-3xl border px-4 text-sm font-medium hover:bg-accent"><Camera className="size-4" />{props.avatarBusy ? t("uploading") : t("changeAvatar")}</Label><Input id="avatar-upload" type="file" accept="image/*" className="sr-only" disabled={props.avatarBusy} onChange={(event) => { props.uploadAvatar(event); event.currentTarget.value = ""; }} /><p className="mt-2 text-xs text-muted-foreground">{t("avatarHint")}</p></div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="full-name">{t("fullName")}</Label><Input id="full-name" maxLength={100} value={props.fullName} onChange={(event) => props.setFullName(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="phone-number">{t("phoneNumber")}</Label><Input id="phone-number" maxLength={20} value={props.phoneNumber} onChange={(event) => props.setPhoneNumber(event.target.value)} /></div>
              <div className="space-y-2"><Label>{t("gender")}</Label><Select value={props.gender == null ? "none" : String(props.gender)} onValueChange={(value) => props.setGender(value === "none" ? null : Number(value) as GenderType)}><SelectTrigger className="w-full"><SelectValue placeholder={t("selectGender")}>{props.gender == null ? t("notSpecified") : props.gender === 0 ? t("male") : props.gender === 1 ? t("female") : t("other")}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">{t("notSpecified")}</SelectItem><SelectItem value="0">{t("male")}</SelectItem><SelectItem value="1">{t("female")}</SelectItem><SelectItem value="2">{t("other")}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{t("dateOfBirth")}</Label><Popover><PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-start text-left font-normal" />}><CalendarDays className="size-4" />{props.dateOfBirth ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(props.dateOfBirth) : <span className="text-muted-foreground">{t("selectDate")}</span>}</PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar value={props.dateOfBirth} onChange={props.setDateOfBirth} disabled={(date) => date > new Date()} locale={locale} previousMonthLabel={t("previousMonth")} nextMonthLabel={t("nextMonth")} /></PopoverContent></Popover></div>
            </div>
            <div className="flex justify-end border-t pt-5"><Button type="submit" disabled={props.busy}><Save />{t("saveChanges")}</Button></div>
          </form>
        </CardContent>
      </Card> : <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div><CardTitle>{t("addressesTitle")}</CardTitle><CardDescription>{t("addressesDescription")}</CardDescription></div>
          <Button onClick={props.onAddAddress}><Plus />{t("addAddress")}</Button>
        </CardHeader>
        <CardContent>
          {!props.addresses.length ? <div className="rounded-2xl border border-dashed p-10 text-center"><MapPin className="mx-auto size-8 text-blue-500" /><p className="mt-3 font-medium">{t("noAddresses")}</p><p className="mt-1 text-sm text-muted-foreground">{t("noAddressesDescription")}</p></div> :
            <div className="grid gap-4 md:grid-cols-2">
              {props.addresses.map((address: Address) => <article key={address.id} className={cn("rounded-2xl border p-5 transition-colors", address.isDefault && "border-blue-300 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20")}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold">{address.receiverName}</h3><p className="mt-1 text-sm text-muted-foreground">{address.phoneNumber}</p></div>{address.isDefault && <Badge className="shrink-0 gap-1 bg-blue-600 text-white hover:bg-blue-600"><Check className="size-3" />{t("defaultAddress")}</Badge>}</div>
                <p className="mt-4 flex gap-2 text-sm leading-relaxed"><MapPin className="mt-0.5 size-4 shrink-0 text-blue-600" />{address.addressLine}</p>
                <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                  <Button type="button" size="sm" variant="outline" onClick={() => props.onEditAddress(address)}>{t("edit")}</Button>
                  {!address.isDefault && <Button type="button" size="sm" variant="ghost" onClick={() => props.onSetDefault(address)}>{t("setDefault")}</Button>}
                  <Button type="button" size="sm" variant="destructive" className="ml-auto" onClick={() => props.onDeleteAddress(address)}><Trash2 className="size-4" />{t("delete")}</Button>
                </div>
              </article>)}
            </div>}
        </CardContent>
      </Card>}
      </div>
    </div>
  );
}
