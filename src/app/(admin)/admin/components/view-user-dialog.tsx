"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, ShieldAlert, ShieldCheck, ShieldPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { toggleUserActive, updateUserRole } from "@/actions/user.action";
import { RoleName, RoleNameLabels, GenderType, GenderTypeLabels } from "@/types/model.types";
import type { UserDTO } from "@/types/model.types";

const FALLBACK_AVATAR = "/images/no-image.png";

interface ViewUserDialogProps {
  user: UserDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  showRoleGrant?: boolean;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ViewUserDialog({ user, open, onOpenChange, onUpdated, showRoleGrant = false }: ViewUserDialogProps) {
  const t = useTranslations("AdminUsers");
  const [isToggling, setIsToggling] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);

  if (!user) return null;

  const avatar = user.profile?.avatarUrl || FALLBACK_AVATAR;

  async function handleToggleActive() {
    if (!user) return;
    setIsToggling(true);
    const res = await toggleUserActive(user.id, !user.isActive);
    setIsToggling(false);
    if (res.success) {
      toast.add({ title: t(user.isActive ? "banSuccess" : "unbanSuccess"), type: "success" });
      onUpdated();
    } else {
      toast.add({ title: t(res.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
    }
  }

  async function handleGrantRole() {
    if (!user || !selectedRole) return;
    setIsGranting(true);
    const res = await updateUserRole(user.id, parseInt(selectedRole));
    setIsGranting(false);
    if (res.success) {
      toast.add({ title: t("grantRoleSuccess"), type: "success" });
      setGrantDialogOpen(false);
      onUpdated();
    } else {
      toast.add({ title: t(res.errorCode ?? "INTERNAL_SERVER_ERROR"), type: "error" });
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("viewDetailTitle")}</DialogTitle>
            <DialogDescription className="sr-only">{user.username}</DialogDescription>
          </DialogHeader>

          {/* User header */}
          <div className="flex items-center gap-4 py-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-muted">
              <Image
                src={avatar}
                alt={user.profile?.fullName || user.username}
                width={80}
                height={80}
                className="size-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">{user.profile?.fullName || user.username}</h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? t("active") : t("banned")}
                </Badge>
                <Badge variant={user.isVerified ? "default" : "outline"}>
                  {user.isVerified ? t("verified") : t("unverified")}
                </Badge>
                <Badge variant="secondary">{RoleNameLabels[user.role]}</Badge>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <InfoItem label={t("emailLabel")} value={user.email} />
            <InfoItem label={t("usernameLabel")} value={user.username} />
            <InfoItem label={t("roleLabel")} value={RoleNameLabels[user.role]} />
            <InfoItem label={t("createdAtLabel")} value={formatDate(user.createdAt)} />
            <InfoItem label={t("updatedAtLabel")} value={formatDate(user.updatedAt)} />
            {user.grantedByUser && (
              <InfoItem label={t("grantedByLabel")} value={`@${user.grantedByUser.username}`} />
            )}
            {user.roleGrantedAt && (
              <InfoItem label={t("roleGrantedAtLabel")} value={formatDate(user.roleGrantedAt)} />
            )}
          </div>

          {/* Profile section */}
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">{t("profileSection")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label={t("fullNameLabel")} value={user.profile?.fullName || "—"} />
              <InfoItem label={t("phoneLabel")} value={user.profile?.phoneNumber || "—"} />
              <InfoItem
                label={t("genderLabel")}
                value={user.profile?.gender != null ? GenderTypeLabels[user.profile.gender as GenderType] : "—"}
              />
              <InfoItem label={t("dobLabel")} value={user.profile?.dateOfBirth ? formatDate(user.profile.dateOfBirth) : "—"} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 border-t pt-4 mt-2">
            <Button
              variant={user.isActive ? "destructive" : "default"}
              size="sm"
              onClick={handleToggleActive}
              disabled={isToggling}
            >
              {isToggling && <Loader2 className="mr-2 size-4 animate-spin" />}
              {user.isActive ? (
                <><ShieldAlert className="mr-1 size-4" />{t("banAccount")}</>
              ) : (
                <><ShieldCheck className="mr-1 size-4" />{t("unbanAccount")}</>
              )}
            </Button>
            {showRoleGrant && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedRole(String(user.role)); setGrantDialogOpen(true); }}>
                <ShieldPlus className="mr-1 size-4" />{t("grantRole")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grant role dialog */}
      {showRoleGrant && (
        <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("grantRoleTitle")}</DialogTitle>
              <DialogDescription>{t("grantRoleDescription", { name: user.profile?.fullName || user.username })}</DialogDescription>
            </DialogHeader>
            <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectRole")}>
                  {selectedRole ? RoleNameLabels[parseInt(selectedRole) as RoleName] : t("selectRole")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(RoleName.SuperAdmin)}>{RoleNameLabels[RoleName.SuperAdmin]}</SelectItem>
                <SelectItem value={String(RoleName.Admin)}>{RoleNameLabels[RoleName.Admin]}</SelectItem>
                <SelectItem value={String(RoleName.Manager)}>{RoleNameLabels[RoleName.Manager]}</SelectItem>
                <SelectItem value={String(RoleName.Staff)}>{RoleNameLabels[RoleName.Staff]}</SelectItem>
                <SelectItem value={String(RoleName.Delivery)}>{RoleNameLabels[RoleName.Delivery]}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setGrantDialogOpen(false)} disabled={isGranting}>
                {t("cancel")}
              </Button>
              <Button size="sm" onClick={handleGrantRole} disabled={isGranting || !selectedRole}>
                {isGranting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t("confirm")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
