import * as React from "react";
import { Check, ChevronsUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SideShiftCoin } from "@workspace/api-client-react";

interface CoinSelectorProps {
  coins: SideShiftCoin[];
  selectedCoin: string;
  selectedNetwork: string;
  onSelect: (coin: string, network: string) => void;
  disabled?: boolean;
}

export function CoinSelector({
  coins,
  selectedCoin,
  selectedNetwork,
  onSelect,
  disabled
}: CoinSelectorProps) {
  const [openCoin, setOpenCoin] = React.useState(false);
  const [openNetwork, setOpenNetwork] = React.useState(false);

  const selectedCoinObj = React.useMemo(() => 
    coins.find((c) => c.coin === selectedCoin),
  [coins, selectedCoin]);

  const availableNetworks = selectedCoinObj?.networks || [];

  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <Popover open={openCoin} onOpenChange={setOpenCoin}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openCoin}
            className="flex-1 justify-between font-mono font-bold text-lg min-w-[140px]"
            disabled={disabled}
          >
            {selectedCoinObj ? selectedCoinObj.coin.toUpperCase() : "Select"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 border-2 border-foreground brutalist-shadow-sm">
          <Command>
            <CommandInput placeholder="Search coin..." />
            <CommandList>
              <CommandEmpty>No coin found.</CommandEmpty>
              <CommandGroup>
                {coins.map((coin) => (
                  <CommandItem
                    key={coin.coin}
                    value={`${coin.name} ${coin.coin}`}
                    onSelect={() => {
                      const newNetwork = coin.networks[0] || "";
                      onSelect(coin.coin, newNetwork);
                      setOpenCoin(false);
                    }}
                    className="font-mono text-base font-medium flex items-center justify-between cursor-pointer"
                  >
                    <span>{coin.coin.toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground ml-2 truncate">{coin.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedCoin === coin.coin ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={openNetwork} onOpenChange={setOpenNetwork}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openNetwork}
            className="flex-1 justify-between font-mono font-bold text-sm min-w-[120px] bg-accent/20"
            disabled={disabled || availableNetworks.length === 0}
          >
            {selectedNetwork ? selectedNetwork.toUpperCase() : "Net"}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[160px] p-0 border-2 border-foreground brutalist-shadow-sm">
          <Command>
            <CommandList>
              <CommandEmpty>No network found.</CommandEmpty>
              <CommandGroup>
                {availableNetworks.map((net) => (
                  <CommandItem
                    key={net}
                    value={net}
                    onSelect={(val) => {
                      onSelect(selectedCoin, net);
                      setOpenNetwork(false);
                    }}
                    className="font-mono cursor-pointer"
                  >
                    {net.toUpperCase()}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedNetwork === net ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
