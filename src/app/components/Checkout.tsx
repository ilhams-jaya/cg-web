import React from "react";

export default function Checkout() {
  const currentDate = new Date();

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <>
      <div className="checkout p-8 h-full bg-white border-l-2 border-gray-300 w-2/6 fixed">
        <div className="checkout-header">
          <h1 className="text-2xl">Checkout</h1>
          <p className="mt-4 text-sm">{formattedDate}</p>
          <input
            type="text"
            placeholder="Add Customer Name"
            className="border rounded-md p-2 w-full mt-2"
          />
        </div>
        <div className="checkout-items">
          
        </div>
        <div className="checkout-price flex align-bottom">
          <button>Payment</button>
        </div>
      </div>
    </>
  );
}