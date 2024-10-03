import React, { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

export default function App() {
  const [people, setPeople] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showDebts, setShowDebts] = useState(false);

  const addPerson = () => {
    if (newPersonName) {
      setPeople([...people, { name: newPersonName, items: [], payments: [], id: Date.now() }]);
      setNewPersonName('');
    }
  };

  const addItem = (person, itemName, amount) => {
    const updatedPeople = people.map(p => 
      p.id === person.id ? { ...p, items: [...p.items, { name: itemName, amount: parseFloat(amount) }]} : p
    );
    setPeople(updatedPeople);
  };

  const addPayment = (person, amount) => {
    const updatedPeople = people.map(p => 
      p.id === person.id ? { ...p, payments: [...p.payments, parseFloat(amount)] } : p
    );
    setPeople(updatedPeople);
  };

  const deletePerson = (id) => {
    setPeople(people.filter(p => p.id !== id));
    setSelectedPerson(null);
  };

  const calculateDebts = () => {
    let totalSpent = 0;
    let totalPaid = 0;
    const balances = people.map(person => {
      const spent = person.items.reduce((sum, item) => sum + item.amount, 0);
      const paid = person.payments.reduce((sum, pay) => sum + pay, 0);
      totalSpent += spent;
      totalPaid += paid;
      return { ...person, balance: paid - spent };
    });

    if (Math.abs(totalSpent - totalPaid) > 0.01) {
      return { error: "Total payments do not match total expenses." };
    }

    const debtList = [];
    const sortedBalances = balances.sort((a, b) => a.balance - b.balance);
    let i = 0, j = sortedBalances.length - 1;

    while (i < j) {
      const lender = sortedBalances[j];
      const borrower = sortedBalances[i];
      const amount = Math.min(-borrower.balance, lender.balance);
      if (amount > 0) {
        debtList.push({ from: borrower.name, to: lender.name, amount: amount.toFixed(2) });
        sortedBalances[i].balance += amount;
        sortedBalances[j].balance -= amount;
      }
      if (borrower.balance >= 0) i++;
      if (lender.balance <= 0) j--;
    }

    return debtList;
  };

  const debts = calculateDebts();

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Add Person</CardTitle>
        </CardHeader>
        <CardContent>
          <Input 
            value={newPersonName} 
            onChange={(e) => setNewPersonName(e.target.value)} 
            placeholder="Name" 
          />
        </CardContent>
        <CardFooter>
          <Button onClick={addPerson}>Add</Button>
        </CardFooter>
      </Card>

      <PeopleList people={people} onSelect={setSelectedPerson} />

      <Button className="fixed top-4 right-4" onClick={() => setShowDebts(true)}>Debts</Button>

      {selectedPerson && (
        <PersonProfileDialog 
          person={selectedPerson} 
          onClose={() => setSelectedPerson(null)}
          onAddItem={addItem}
          onAddPayment={addPayment}
          onDelete={() => deletePerson(selectedPerson.id)}
        />
      )}

      <DebtsDialog 
        open={showDebts} 
        onClose={() => setShowDebts(false)} 
        debts={debts}
      />
    </div>
  );
}

function PeopleList({ people, onSelect }) {
  return (
    <ol className="space-y-2">
      {people.map(person => (
        <li key={person.id} className="cursor-pointer" onClick={() => onSelect(person)}>
          <Avatar src="" className="mr-2" /> {person.name} - ${person.payments.reduce((a, b) => a + b, 0) - person.items.reduce((a, b) => a + b.amount, 0).toFixed(2)}
        </li>
      ))}
    </ol>
  );
}

function PersonProfileDialog({ person, onClose, onAddItem, onAddPayment, onDelete }) {
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{person.name}'s Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-bold">Items:</h4>
            {person.items.map((item, idx) => (
              <div key={idx}>{item.name}: ${item.amount}</div>
            ))}
            <Input 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
              placeholder="Item Name" 
            />
            <Input 
              value={itemAmount} 
              onChange={(e) => setItemAmount(e.target.value)} 
              placeholder="Amount" 
            />
            <Button onClick={() => onAddItem(person, itemName, itemAmount)}>Add Item</Button>
          </div>
          <div>
            <h4 className="font-bold">Payments:</h4>
            {person.payments.map((payment, idx) => (
              <div key={idx}>Payment: ${payment}</div>
            ))}
            <Input 
              value={paymentAmount} 
              onChange={(e) => setPaymentAmount(e.target.value)} 
              placeholder="Payment Amount" 
            />
            <Button onClick={() => onAddPayment(person, paymentAmount)}>Add Payment</Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onDelete}>Delete Person</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DebtsDialog({ open, onClose, debts }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Debts</DialogTitle>
        </DialogHeader>
        {debts.error ? (
          <p className="text-red-500">{debts.error}</p>
        ) : (
          <ol>
            {debts.map((debt, idx) => (
              <li key={idx}>
                {debt.from} owes {debt.to} ${debt.amount}
              </li>
            ))}
          </ol>
        )}
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}