<DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transaktionsverlauf für {selectedPromoterHistory?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Menge</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionHistory[selectedPromoterHistory?.id]?.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(transaction.date).toLocaleString()}</TableCell>
                    <TableCell>{transaction.itemName}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>{transaction.size}</TableCell>
                    <TableCell>
                      {transaction.isBurned ? (
                        <span className="text-red-500">Verbrannt</span>
                      ) : transaction.quantity > 0 ? (
                        <span className="text-green-500">Zurückgegeben</span>
                      ) : (
                        <span className="text-blue-500">Entnommen</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInactiveConfirmDialog} onOpenChange={setShowInactiveConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promoter inaktiv setzen</DialogTitle>
          </DialogHeader>
          <p>Dieser Promoter hat noch Artikel in seinem Inventar. Möchten Sie wirklich fortfahren und den Promoter inaktiv setzen?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInactiveConfirmDialog(false)}>Abbrechen</Button>
            <Button onClick={handleConfirmInactive}>Bestätigen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={burnDialogOpen} onOpenChange={setBurnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Artikel verbrennen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="burnQuantity" className="text-right">
                Menge
              </Label>
              <Input
                id="burnQuantity"
                type="number"
                value={burnQuantity}
                onChange={(e) => setBurnQuantity(parseInt(e.target.value))}
                className="col-span-3"
              />
            </div>
            {burnItem && burnItem.sizes.length > 1 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="burnSize" className="text-right">
                  Größe
                </Label>
                <Select value={burnSize} onValueChange={setBurnSize}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Wählen Sie eine Größe" />
                  </SelectTrigger>
                  <SelectContent>
                    {burnItem.sizes.map((size, index) => (
                      <SelectItem key={index} value={size.size}>
                        {size.size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="burnPromoter" className="text-right">
                Promoter
              </Label>
              <Select value={burnPromoter} onValueChange={setBurnPromoter}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Wählen Sie einen Promoter" />
                </SelectTrigger>
                <SelectContent>
                  {promoters.map((promoter) => (
                    <SelectItem key={promoter.id} value={promoter.name}>
                      {promoter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBurnDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleConfirmBurn}>Bestätigen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

