import { Card, CardContent, CardFooter, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const popularProducts = [
  { id: 1, name: "Adidas CoreFit T-Shirt", price: 39.9 },
  { id: 2, name: "Puma Ultra Warm Zip", price: 59.9 },
  { id: 3, name: "Nike Air Essentials Pullover", price: 69.9 },
  { id: 4, name: "Nike Dri Flex T-Shirt", price: 29.9 },
  { id: 5, name: "Under Armour StormFleece", price: 49.9 },
];

const latestTransactions = [
  { id: 1, customer: "John Doe", status: "completed", amount: 1400 },
  { id: 2, customer: "Jane Smith", status: "pending", amount: 2100 },
  { id: 3, customer: "Michael Johnson", status: "completed", amount: 1300 },
  { id: 4, customer: "Lily Adams", status: "processing", amount: 2500 },
  { id: 5, customer: "Sam Brown", status: "completed", amount: 1400 },
];

const CardList = ({ title }: { title: string }) => {
  return (
    <div>
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      <div className="flex flex-col gap-2">
        {title === "Popular Products"
          ? popularProducts.map((item) => (
              <Card
                key={item.id}
                className="flex-row items-center justify-between gap-4 p-4"
              >
                <CardContent className="flex-1 p-0">
                  <CardTitle className="text-sm font-medium">
                    {item.name}
                  </CardTitle>
                </CardContent>
                <CardFooter className="p-0">${item.price}</CardFooter>
              </Card>
            ))
          : latestTransactions.map((item) => (
              <Card
                key={item.id}
                className="flex-row items-center justify-between gap-4 p-4"
              >
                <CardContent className="flex-1 p-0">
                  <CardTitle className="text-sm font-medium">
                    {item.customer}
                  </CardTitle>
                  <Badge variant="secondary">{item.status}</Badge>
                </CardContent>
                <CardFooter className="p-0">
                  ${item.amount.toLocaleString()}
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  );
};

export default CardList;
