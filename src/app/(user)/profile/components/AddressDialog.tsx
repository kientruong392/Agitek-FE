"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Address, CreateAddressInput, UpdateAddressInput } from "@/types/model.types";

type AddressDialogProps = {
  open: boolean;
  address: Address | null;
  isFirstAddress: boolean;
  isEditingDefault: boolean;
  isSaving: boolean;
  title: string;
  description: string;
  labels: { receiver: string; phone: string; line: string; makeDefault: string; save: string; cancel: string };
  onOpenChange: (open: boolean) => void;
  onSave: (input: CreateAddressInput | UpdateAddressInput) => void;
};

export default function AddressDialog({ open, address, isFirstAddress, isEditingDefault, isSaving, title, description, labels, onOpenChange, onSave }: AddressDialogProps) {
  const [receiverName, setReceiverName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    setReceiverName(address?.receiverName ?? "");
    setPhoneNumber(address?.phoneNumber ?? "");
    setAddressLine(address?.addressLine ?? "");
    setIsDefault(address?.isDefault ?? isFirstAddress);
  }, [address, isFirstAddress, open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({ receiverName, phoneNumber, addressLine, isDefault });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2"><Label htmlFor="address-receiver">{labels.receiver}</Label><Input id="address-receiver" required maxLength={100} value={receiverName} onChange={(event) => setReceiverName(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="address-phone">{labels.phone}</Label><Input id="address-phone" required maxLength={20} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="address-line">{labels.line}</Label><Input id="address-line" required maxLength={255} value={addressLine} onChange={(event) => setAddressLine(event.target.value)} /></div>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox checked={isDefault} disabled={isEditingDefault || (isFirstAddress && !address)} onCheckedChange={(checked) => setIsDefault(checked === true)} />
            {labels.makeDefault}
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{labels.cancel}</Button>
            <Button type="submit" disabled={isSaving}>{labels.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
