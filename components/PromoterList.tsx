import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash, EyeOff, History, Pin } from 'lucide-react'
import Image from "next/image"
import EditPromoterDialog from './EditPromoterDialog'
import PromoterHistoryDialog from './PromoterHistoryDialog'
import InactiveConfirmDialog from './InactiveConfirmDialog'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import { usePinned } from '../hooks/usePinned'
import { Skeleton } from './ui/skeleton'
import { usePromoters, PromoterWithDetails } from '@/hooks/usePromoters'

interface PromoterListProps {
  promoters: PromoterWithDetails[];
  onPromoterUpdated: () => void;
  onPromoterClick?: (promoter: PromoterWithDetails) => void;
}

export default function PromoterList({ 
  promoters,
  onPromoterUpdated,
  onPromoterClick
}: PromoterListProps) {
  const [editingPromoter, setEditingPromoter] = useState<PromoterWithDetails | null>(null)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [selectedPromoterHistory, setSelectedPromoterHistory] = useState<PromoterWithDetails | null>(null)
  const [showInactiveConfirmDialog, setShowInactiveConfirmDialog] = useState(false)
  const [inactivePromoter, setInactivePromoter] = useState<PromoterWithDetails | null>(null)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [deletingPromoter, setDeletingPromoter] = useState<PromoterWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Transform promoters to match usePinned requirements
  const promotersForPinned = promoters.map(p => ({
    id: p.id,
    isActive: true // Always set to true so they're always included
  }));
  const { sortedItems: sortedPromoterIds, togglePin, isPinned } = usePinned(promotersForPinned, 'promoter');
  
  // Get the full promoter objects in the sorted order, including inactive ones
  const sortedPromoters = sortedPromoterIds
    .map(id => promoters.find(p => p.id === id.id))
    .filter((p): p is PromoterWithDetails => p !== undefined);

  const { toggleActive, removePromoter, updatePromoterDetails, loading } = usePromoters();

  const handleEdit = (promoter: PromoterWithDetails) => {
    setEditingPromoter(promoter)
  }

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await removePromoter(id);
      onPromoterUpdated();
    } catch (error) {
      console.error('Error deleting promoter:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmDialog(false);
      setDeletingPromoter(null);
    }
  }

  const handleDeleteClick = (promoter: PromoterWithDetails) => {
    setDeletingPromoter(promoter);
    setShowDeleteConfirmDialog(true);
  }

  const handleToggleInactive = (promoter: PromoterWithDetails) => {
    if (promoter.is_active) {
      setInactivePromoter(promoter)
      setShowInactiveConfirmDialog(true)
    } else {
      togglePromoterStatus(promoter.id)
    }
  }

  const togglePromoterStatus = async (id: string) => {
    try {
      await toggleActive(id);
      onPromoterUpdated();
    } catch (error) {
      console.error('Error toggling promoter status:', error);
    }
  }

  const handleTogglePin = (id: string) => {
    togglePin(id);
  }

  const handleShowHistory = (promoter: PromoterWithDetails) => {
    setSelectedPromoterHistory(promoter);
    setShowHistoryDialog(true);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="w-full h-48" />
            <CardContent className="p-4">
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedPromoters.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Keine Promoter gefunden. Fügen Sie einen neuen Promoter hinzu.</p>
          </div>
        ) : sortedPromoters.map((promoter) => (
          <Card 
            key={promoter.id} 
            className={`overflow-hidden ${!promoter.is_active ? 'opacity-50' : ''} cursor-pointer`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.dropdown-menu-container')) {
                return;
              }
              onPromoterClick?.(promoter);
            }}
          >
            <div className="relative">
              <Image
                src={promoter.photo_url || '/placeholder.svg'}
                alt={promoter.name}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              {isPinned(promoter.id) && (
                <Pin className="absolute top-2 left-2 h-6 w-6 text-primary" />
              )}
              <div className="absolute top-2 right-2 dropdown-menu-container">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault();
                      handleEdit(promoter);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Bearbeiten</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault();
                      handleDeleteClick(promoter);
                    }}>
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Löschen</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault();
                      handleToggleInactive(promoter);
                    }}>
                      <EyeOff className="mr-2 h-4 w-4" />
                      <span>{promoter.is_active ? 'Inaktiv setzen' : 'Aktiv setzen'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault();
                      handleShowHistory(promoter);
                    }}>
                      <History className="mr-2 h-4 w-4" />
                      <span>Verlauf</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault();
                      handleTogglePin(promoter.id);
                    }}>
                      <Pin className="mr-2 h-4 w-4" />
                      <span>{isPinned(promoter.id) ? 'Entpinnen' : 'Pinnen'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg text-center">{promoter.name}</h3>
              {promoter.transactionCount && promoter.transactionCount > 0 && (
                <p className="text-sm text-center text-gray-500">
                  Transaktionen: {promoter.transactionCount}
                </p>
              )}
              {promoter.phone_number && (
                <p className="text-sm text-center text-gray-500 mt-1">
                  Tel: {promoter.phone_number}
                </p>
              )}
              {promoter.clothing_size && (
                <p className="text-sm text-center text-gray-500 mt-1">
                  Größe: {promoter.clothing_size}
                </p>
              )}
              {promoter.address && (
                <p className="text-sm text-center text-gray-500 mt-1">
                  Adresse: {promoter.address}
                </p>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowHistory(promoter);
                }}
              >
                <History className="mr-2 h-4 w-4" />
                Verlauf
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {editingPromoter && (
        <EditPromoterDialog
          promoter={editingPromoter}
          setEditingPromoter={setEditingPromoter}
          onUpdate={onPromoterUpdated}
        />
      )}
      {showHistoryDialog && selectedPromoterHistory && (
        <PromoterHistoryDialog
          promoter={selectedPromoterHistory}
          setShowHistoryDialog={setShowHistoryDialog}
        />
      )}
      <InactiveConfirmDialog
        showDialog={showInactiveConfirmDialog}
        setShowDialog={setShowInactiveConfirmDialog}
        promoter={inactivePromoter}
        onConfirm={() => {
          if (inactivePromoter) {
            togglePromoterStatus(inactivePromoter.id)
            setInactivePromoter(null)
          }
        }}
      />
      <DeleteConfirmDialog
        isOpen={showDeleteConfirmDialog}
        onClose={() => setShowDeleteConfirmDialog(false)}
        onConfirm={() => deletingPromoter && handleDelete(deletingPromoter.id)}
        title="Promoter löschen"
        description="Sind Sie sicher, dass Sie diesen Promoter löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        itemName={deletingPromoter?.name}
        isDeleting={isDeleting}
      />
    </>
  )
}

