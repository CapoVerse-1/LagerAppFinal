import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Undo2 } from 'lucide-react'
import PromoterList from './PromoterList'
import PromoterItemList from './PromoterItemList'
import AddPromoterDialog from './AddPromoterDialog'
import { usePromoters, PromoterWithDetails } from '@/hooks/usePromoters'
import { useRouter } from 'next/navigation'
import EditPromoterDialog from './EditPromoterDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPromoterInventory } from '@/lib/api/promoters'
import PromoterHistoryDialog from './PromoterHistoryDialog'
import { recordReturn } from '@/lib/api/transactions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useUser } from '@/contexts/UserContext'
import { useToast } from '@/hooks/use-toast'

interface PromoterViewProps {
  selectedPromoter: PromoterWithDetails | null;
  setSelectedPromoter: (promoter: PromoterWithDetails | null) => void;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  promoterItems: any[];
  setPromoterItems: (items: any[]) => void;
  items: any[];
  setItems: (items: any[]) => void;
  transactionHistory: Record<string, any[]>;
  setTransactionHistory: (history: Record<string, any[]>) => void;
  refreshKey: number;
  promoters: PromoterWithDetails[];
}

interface SimplePromoter {
  id: string;
  name: string;
  photo_url?: string;
  phone_number?: string;
  clothing_size?: string;
  is_active: boolean;
  transactionCount?: number;
  address?: string;
}

export default function PromoterView({
  selectedPromoter,
  setSelectedPromoter,
  selectedItem,
  setSelectedItem,
  promoterItems,
  setPromoterItems,
  items,
  setItems,
  transactionHistory,
  setTransactionHistory,
  refreshKey,
  promoters
}: PromoterViewProps) {
  const [showAddPromoterDialog, setShowAddPromoterDialog] = useState(false)
  const [editingPromoter, setEditingPromoter] = useState<PromoterWithDetails | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [promoterInventory, setPromoterInventory] = useState<any[]>([])
  const router = useRouter();
  const { currentUser } = useUser();
  const { toast } = useToast();
  
  const [showReturnAllConfirmDialog, setShowReturnAllConfirmDialog] = useState(false);
  const [isReturningAllItems, setIsReturningAllItems] = useState(false);

  const { refreshPromoters } = usePromoters();
  
  const loadAndSetPromoterInventory = useCallback(async () => {
    if (selectedPromoter?.id) {
      console.log(`[PromoterView] Loading inventory for ${selectedPromoter.id} due to change or refreshKey.`);
      setInventoryLoading(true);
      try {
        const inventory = await getPromoterInventory(selectedPromoter.id);
        setPromoterInventory(inventory);
      } catch (error) {
        console.error('Error loading promoter inventory:', error);
        setPromoterInventory([]);
      } finally {
        setInventoryLoading(false);
      }
    } else {
      setPromoterInventory([]);
    }
  }, [selectedPromoter]);

  useEffect(() => {
    loadAndSetPromoterInventory();
  }, [selectedPromoter, refreshKey, loadAndSetPromoterInventory]);

  const handleBackToPromoters = () => {
    setSelectedPromoter(null);
    setSelectedItem(null);
    // Update URL to remove query parameters
    router.push('/inventory');
  };

  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const handleShowHistory = () => {
    setShowHistoryDialog(true);
  };

  const handleConfirmReturnAll = async () => {
    if (!selectedPromoter || !currentUser?.id) {
      toast({
        title: "Fehler",
        description: "Promoter oder Mitarbeiter nicht identifiziert. Aktion abgebrochen.",
        variant: "destructive",
      });
      setShowReturnAllConfirmDialog(false);
      return;
    }

    if (promoterInventory.length === 0) {
      toast({
        title: "Keine Artikel zum Zurückgeben",
        description: "Dieser Promoter hat aktuell keine Artikel im Inventar.",
        variant: "default",
      });
      setShowReturnAllConfirmDialog(false);
      return;
    }

    setIsReturningAllItems(true);
    setShowReturnAllConfirmDialog(false); // Close dialog once confirmed

    const returnPromises = promoterInventory.map(invItem => {
      // invItem structure based on getPromoterInventory: { item: {id, name, ...}, size: {id, size, ...}, quantity }
      const commonData = {
        itemId: invItem.item.id,
        itemSizeId: invItem.size.id,
        quantity: invItem.quantity,
        promoterId: selectedPromoter.id,
        employeeId: currentUser.id,
        notes: `Automatische Rückgabe aller Artikel für ${selectedPromoter.name}`
      };
      return recordReturn(commonData);
    });

    try {
      const results = await Promise.allSettled(returnPromises);
      let successCount = 0;
      const failedReturns: { name: string; size: string; quantity: number; reason: string }[] = [];

      results.forEach((result, index) => {
        const invItem = promoterInventory[index];
        const itemName = invItem.item.name || `Item ID ${invItem.item.id}`;
        const itemSize = invItem.size.size || `Size ID ${invItem.size.id}`;

        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          const errorMessage = (result.reason instanceof Error) ? result.reason.message : String(result.reason);
          failedReturns.push({
            name: itemName,
            size: itemSize,
            quantity: invItem.quantity,
            reason: errorMessage,
          });
          console.error(`Fehler bei Rückgabe von ${itemName} (${itemSize}):`, result.reason);
        }
      });

      if (failedReturns.length > 0) {
        const successMsg = successCount > 0 ? `${successCount} Artikel erfolgreich zurückgegeben. ` : '';
        const failureIntro = `${failedReturns.length} Artikel konnten nicht zurückgegeben werden:`;
        const failuresSummary = failedReturns
          .map(f => `${f.name} (Größe: ${f.size}, Menge: ${f.quantity}): ${f.reason}`)
          .join('; ');
        let toastDescription = `${successMsg}${failureIntro} ${failuresSummary}`;
        if (toastDescription.length > 250) {
          toastDescription = toastDescription.substring(0, 247) + "... (Details in Konsole)";
        }
        toast({
          title: successCount > 0 ? "Teilweise erfolgreich" : "Fehler bei der Rückgabe",
          description: toastDescription,
          variant: successCount === 0 ? "destructive" : "default",
          duration: failedReturns.length > 1 ? 9000 : 6000,
        });
      } else {
        toast({
          title: "Erfolg",
          description: `Alle ${successCount} Artikel von ${selectedPromoter.name} erfolgreich zurückgegeben.`,
        });
      }

      // Refresh inventory
      await loadAndSetPromoterInventory();
      // Potentially trigger a broader refresh if other components depend on this data, e.g. using the refreshKey logic
      // For now, only local inventory is refreshed.

    } catch (error) {
      console.error("Unerwarteter Fehler beim Zurückgeben aller Artikel:", error);
      toast({
        title: "Schwerwiegender Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsReturningAllItems(false);
    }
  };

  const handleEdit = (promoter: SimplePromoter) => {
    const fullPromoter = promoters.find(p => p.id === promoter.id);
    if (fullPromoter) {
      setEditingPromoter(fullPromoter);
    }
  };

  const handleUpdatePromoter = () => {
    refreshPromoters();
  };
  
  // Map ONLY for PromoterList
  const simplePromoters: SimplePromoter[] = promoters.map(p => ({
      id: p.id,
      name: p.name,
      photo_url: p.photo_url || undefined,
      phone_number: p.phone_number || undefined,
      clothing_size: p.clothing_size || undefined,
      address: p.address || undefined, 
      is_active: p.is_active,
      transactionCount: p.transactionCount // Assuming transactionCount exists
  }));

  return (
    <>
      {selectedPromoter ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <Button onClick={handleBackToPromoters}>Zurück zu Promotern</Button>
            <h2 className="text-xl font-semibold">{selectedPromoter.name}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShowHistory} disabled={isReturningAllItems}>
                Verlauf anzeigen
              </Button>
              <AlertDialog open={showReturnAllConfirmDialog} onOpenChange={setShowReturnAllConfirmDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isReturningAllItems || inventoryLoading || promoterInventory.length === 0}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    {isReturningAllItems ? "Wird verarbeitet..." : "Alle zurückgeben"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alle Artikel zurückgeben?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sind Sie sicher, dass Sie alle Artikel von {selectedPromoter.name} zurückgeben möchten? 
                      Diese Aktion kann nicht rückgängig gemacht werden und wird für jeden Artikel eine einzelne Transaktion erstellen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmReturnAll} disabled={isReturningAllItems}>
                      {isReturningAllItems ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Bestätigen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Display promoter details */}
          <div className="border rounded-lg p-4 mb-4 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedPromoter.address && (
                <div>
                  <h3 className="font-medium text-sm">Adresse:</h3>
                  <p className="text-sm text-muted-foreground">{selectedPromoter.address}</p>
                </div>
              )}
              {selectedPromoter.clothing_size && (
                <div>
                  <h3 className="font-medium text-sm">Kleidungsgröße:</h3>
                  <p className="text-sm text-muted-foreground">{selectedPromoter.clothing_size}</p>
                </div>
              )}
              {selectedPromoter.phone_number && (
                <div>
                  <h3 className="font-medium text-sm">Telefonnummer:</h3>
                  <p className="text-sm text-muted-foreground">{selectedPromoter.phone_number}</p>
                </div>
              )}
            </div>
            {selectedPromoter.notes && (
              <div className="mt-4">
                <h3 className="font-medium text-sm">Notizen:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedPromoter.notes}</p>
              </div>
            )}
          </div>

          <Tabs value="inventory" defaultValue="inventory" className="mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="inventory" className="w-full">Aktuelles Inventar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="inventory">
              {inventoryLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : promoterInventory.length > 0 ? (
                <PromoterItemList
                  promoterItems={promoterInventory.map(item => ({
                    id: `${item.item.id}-${item.size.id}`,
                    name: item.item.name,
                    productId: item.item.product_id,
                    image: item.item.image_url || '/placeholder.svg',
                    quantity: item.quantity,
                    size: item.size.size,
                    brand: item.item.brands?.name || 'Unknown',
                    promoterId: selectedPromoter.id
                  }))}
                  setPromoterItems={() => {}}
                  selectedItem={selectedItem}
                  setSelectedItem={setSelectedItem}
                  items={items}
                  setItems={setItems}
                  promoters={promoters}
                  setPromoters={() => refreshPromoters()}
                  transactionHistory={transactionHistory}
                  setTransactionHistory={setTransactionHistory}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Dieser Promoter hat derzeit keine Artikel.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {showHistoryDialog && selectedPromoter && (
            <PromoterHistoryDialog
              promoter={selectedPromoter}
              setShowHistoryDialog={setShowHistoryDialog}
            />
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Promoter</h2>
            <Button onClick={() => setShowAddPromoterDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Neuer Promoter
            </Button>
          </div>
          <PromoterList
            promoters={promoters}
            onPromoterUpdated={handleUpdatePromoter}
            onPromoterClick={(promoter) => {
              const fullPromoter = promoters.find(p => p.id === promoter.id);
              if (fullPromoter) {
                setSelectedPromoter(fullPromoter);
              } else {
                const foundPromoter = promoters.find(p => p.id === promoter.id);
                if (foundPromoter) setSelectedPromoter(foundPromoter);
              }
            }}
          />
        </>
      )}

      {showAddPromoterDialog && (
        <AddPromoterDialog
          showDialog={showAddPromoterDialog}
          setShowDialog={setShowAddPromoterDialog}
          onSuccess={refreshPromoters}
        />
      )}

      <EditPromoterDialog
        promoter={editingPromoter}
        setEditingPromoter={setEditingPromoter}
        onUpdate={handleUpdatePromoter}
      />
    </>
  );
}

