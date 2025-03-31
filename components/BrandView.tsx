import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import BrandList from './BrandList'
import ItemList from './ItemList'
import AddBrandDialog from './AddBrandDialog'
import AddItemDialog from './AddItemDialog'
import { useBrands } from '@/hooks/useBrands'
import { useRouter } from 'next/navigation'
import EditBrandDialog from './EditBrandDialog'
import { BrandWithItemCount } from '@/hooks/useBrands'

interface BrandViewProps {
  selectedBrand: BrandWithItemCount | null;
  setSelectedBrand: (brand: BrandWithItemCount | null) => void;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  promoters: any[];
  setPromoters: (promoters: any[]) => void;
  promoterItems: any[];
  setPromoterItems: (items: any[]) => void;
}

export default function BrandView({
  selectedBrand,
  setSelectedBrand,
  selectedItem,
  setSelectedItem,
  promoters, 
  setPromoters, 
  promoterItems,
  setPromoterItems
}: BrandViewProps) {
  const [showAddBrandDialog, setShowAddBrandDialog] = useState(false)
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [editingBrand, setEditingBrand] = useState<BrandWithItemCount | null>(null)
  const router = useRouter();
  
  const { brands, loading: brandsLoading, refreshBrands, updateBrandDetails } = useBrands();
  
  const handleBackToBrands = () => {
    setSelectedBrand(null);
    setSelectedItem(null);
    // Update URL to remove query parameters
    router.push('/inventory');
  };
  
  return (
    <>
      {selectedBrand ? (
        <>
          <div className="flex gap-4 mb-4">
            <Button onClick={handleBackToBrands}>Zurück zu Marken</Button>
            <Button onClick={() => setShowAddItemDialog(true)}>Neuer Artikel</Button>
          </div>
          <ItemList
            brandId={selectedBrand.id}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            promoters={promoters}
            setPromoters={setPromoters}
            promoterItems={promoterItems}
            setPromoterItems={setPromoterItems}
          />
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Marken</h2>
            <Button onClick={() => setShowAddBrandDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Neue Marke
            </Button>
          </div>
          <BrandList
            brands={brands}
            loading={brandsLoading}
            onBrandClick={(brandId) => {
              const brand = brands.find(b => b.id === brandId);
              if (brand) {
                setSelectedBrand(brand);
              }
            }}
            onBrandUpdated={refreshBrands}
            onEditBrand={setEditingBrand}
          />
        </>
      )}

      {showAddBrandDialog && (
        <AddBrandDialog
          showDialog={showAddBrandDialog}
          setShowDialog={setShowAddBrandDialog}
          onSuccess={refreshBrands}
        />
      )}

      <AddItemDialog
        showDialog={showAddItemDialog && selectedBrand !== null}
        setShowDialog={setShowAddItemDialog}
        brandId={selectedBrand?.id || ''}
      />

      <EditBrandDialog
        brand={editingBrand}
        setEditingBrand={setEditingBrand}
        onUpdate={updateBrandDetails}
        onSuccess={refreshBrands}
      />
    </>
  );
}

