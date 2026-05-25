import { useState } from "react";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Users, Moon, Clock, CreditCard } from "lucide-react";
import { es } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BookingDialogProps {
  camping: {
    name: string;
    price: string;
  };
}

export function BookingDialog({ camping }: BookingDialogProps) {
  const [date, setDate] = useState<Date>();
  const [nights, setNights] = useState([1]);
  const [guests, setGuests] = useState(2);
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();

  const pricePerNight = parseInt(camping.price.replace(/\D/g, ""));
  const total = pricePerNight * nights[0];
  const deposit = Math.round(total * 0.5); // 50% deposit

  const handleBooking = () => {
    if (!date) {
      toast({
        title: "Selecciona una fecha",
        description: "Por favor elige el día de tu llegada.",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);
    // Mock payment process
    setTimeout(() => {
      setIsBooking(false);
      toast({
        title: "¡Reserva Exitosa!",
        description: `Tu estancia en ${camping.name} ha sido reservada para el ${format(date, "PPP", { locale: es })}.`,
      });
    }, 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-widest text-xs px-6">
          Reservar Ahora
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{camping.name}</DialogTitle>
          <DialogDescription className="font-sans">
            Configura tu estancia y asegura tu cupo con un anticipo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Date Picker */}
          <div className="grid gap-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Fecha de llegada</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal border-border/50",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const minLeadTime = new Date(today);
                    minLeadTime.setDate(today.getDate() + 2);
                    if (date < minLeadTime) return true;

                    // La restricción de temporada se valida en el paso final de reserva
                    // dependiendo del plan elegido. Aquí permitimos selección libre.
                    return false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Nights Slider */}
          <div className="grid gap-4">
            <div className="flex justify-between items-end">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Moon className="w-3 h-3" /> Noches
              </Label>
              <span className="font-serif text-xl font-bold">{nights[0]}</span>
            </div>
            <Slider
              value={nights}
              onValueChange={setNights}
              max={15}
              min={1}
              step={1}
              className="py-2"
            />
          </div>

          {/* Guests & Time Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/30 p-3 rounded-lg flex items-center gap-3">
              <Users className="w-4 h-4 text-accent" />
              <div>
                <p className="text-[10px] uppercase text-muted-foreground leading-none mb-1">Huéspedes</p>
                <p className="text-sm font-bold">2 Adultos</p>
              </div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg flex items-center gap-3">
              <Clock className="w-4 h-4 text-accent" />
              <div>
                <p className="text-[10px] uppercase text-muted-foreground leading-none mb-1">Check-in</p>
                <p className="text-sm font-bold">3:00 PM</p>
              </div>
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button 
            className="w-full bg-accent hover:bg-accent/90 text-white h-12 text-lg font-bold flex items-center gap-2"
            onClick={handleBooking}
            disabled={isBooking}
          >
            {isBooking ? (
              "Procesando..."
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pagar Anticipo Online
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
