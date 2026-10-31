import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Ticket } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Lista de espera de quem quer ofertas e cupons (role CLIENT, sem cidade definida)
export function ComingSoonWaitlist({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const close = () => {
    setDone(false);
    setName("");
    setEmail("");
    setPhone("");
    onOpenChange(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("city_waitlist").insert({
      city_id: null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, "") || null,
      role: "CLIENT",
    });
    setLoading(false);
    if (error && error.code !== "23505") {
      toast({ title: "Não deu para entrar na lista", description: "Tente de novo em instantes.", variant: "destructive" });
      return;
    }
    setDone(true);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Você está na lista</h3>
            <p className="text-muted-foreground mb-4">Assim que as ofertas e os cupons chegarem, você fica sabendo primeiro.</p>
            <Button onClick={close}>Fechar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <Ticket className="h-5 w-5" />
                <span className="font-medium">Ofertas e cupons</span>
              </div>
              <DialogTitle className="text-xl">Seja avisado primeiro</DialogTitle>
              <DialogDescription>Deixe seu contato e a gente te chama quando as ofertas da sua cidade entrarem no ar.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="wl-name">Seu nome</Label>
                <Input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Como podemos te chamar?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wl-email">Seu e-mail</Label>
                <Input id="wl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wl-phone">WhatsApp (opcional)</Label>
                <Input id="wl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} placeholder="(00) 00000-0000" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
                Quero ser avisado
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
