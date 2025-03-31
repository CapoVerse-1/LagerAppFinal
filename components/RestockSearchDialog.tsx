import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function RestockSearchDialog({ showDialog, setShowDialog, onSearch, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    if (searchTerm) {
      const results = onSearch(searchTerm)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchTerm, onSearch])

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Artikel zum Auffüllen suchen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Input
              placeholder="Artikelname oder ID eingeben"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      onSelect(item)
                      setShowDialog(false)
                    }}
                  >
                    {item.name} (ID: {item.productId})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

