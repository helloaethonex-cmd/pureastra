"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faPlus, faMinus, faTrash } from "@fortawesome/free-solid-svg-icons";


export default function OrderPage() {

  // Dummy cart data (replace with real later)
  const [cart, setCart] = useState([
    {
      id: 1,
      name: "Vitamin C facewash",
      price: 699,
      oldPrice: 899,
      img: "/img/facewash.png",
      qty: 1,
    },
    {
      id: 2,
      name: "Apple Berry Foaming Facewash",
      price: 699,
      oldPrice: 899,
      img: "/img/facewash.png",
      qty: 1,
    },
  ]);

  //  Increase qty
  const increase = (id: number) => {
    setCart(cart.map(item =>
      item.id === id ? { ...item, qty: item.qty + 1 } : item
    ));
  };

  //  Decrease qty
 const decrease = (id: number) => {
  setCart(cart.flatMap(item =>
    item.id === id
      ? item.qty === 1
        ? [] 
        : { ...item, qty: item.qty - 1 }
      : item
  ));
};

  //  Remove item
  const removeItem = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discount = 0.03 * subtotal;
  const total = subtotal - discount;

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-16 px-6">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}    
        <Link href="/">
          <div className="flex items-center gap-3 text-[#5E2B16] font-['Roboto',serif] mb-6 cursor-pointer">
            <FontAwesomeIcon icon={faArrowLeftLong} className="text-[22px]" />
            <h1 className="text-[32px] font-semibold">Cart</h1>
          </div>
        </Link>

        {/* LINE BELOW CART HEADING */}
        <div className="mb-6 border-t border-[#D6C9B6]" />


        {/* ================= EMPTY STATE ================= */}
        {cart.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl text-[#5E2B15] mb-4">
              Oops... Looks like you forgot to add your favourites!
            </h2>

            <Link href="/">
              <button className="bg-[#819744] text-white px-6 py-2 rounded-md">
                Shop Now
              </button>
            </Link>
          </div>
        ) : (

          <>
            {/* ================= PRODUCTS ================= */}
            <div className="space-y-8">

              {cart.map((item) => (
                <div key={item.id} className="flex gap-6 border-b pb-6">

                  {/* IMAGE */}
                  <Image
                    src={item.img}
                    alt={item.name}
                    width={120}
                    height={120}
                    className="rounded-md"
                  />

                  {/* DETAILS */}
                  <div className="flex-1">

                    <h2 className="text-lg font-semibold text-[#5E2B15]">
                      {item.name}
                    </h2>

                    <p className="text-sm text-[#7B6A58]">
                      Size : <span className="text-[#819744]">100ml</span>
                    </p>

                    <p className="text-sm text-[#7B6A58]">
                      Best Suited for: <span className="text-[#819744]">all skin types</span>
                    </p>

                    {/* QTY */}
                    <div className="flex items-center gap-4 mt-3">

                      {/* DECREASE */}
                      <button 
                        onClick={() => decrease(item.id)}
                        className="w-8 h-8 border flex items-center justify-center rounded"
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>

                      {/* QTY */}
                      <span className="text-[16px] font-medium">{item.qty}</span>

                      {/* INCREASE */}
                      <button
                        onClick={() => increase(item.id)}
                        className="w-8 h-8 border flex items-center justify-center rounded"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>

                      {/* DELETE ICON */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-4 text-white bg-[#5E2B15] text-sm px-3 py-1 hover:text-red-500 transition"
                      >
                        Remove <FontAwesomeIcon icon={faTrash} />
                      </button>

                    </div>

                  </div>

                  {/* PRICE */}
                  <div className="text-right">
                    <p className="font-semibold">{item.price}</p>
                    <p className="text-sm line-through text-gray-400">
                      {item.oldPrice}
                    </p>
                  </div>

                </div>
              ))}

            </div>

            {/* ================= SUMMARY ================= */}
            <div className="mt-10 space-y-2 text-[#5E2B15]">

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery cost</span>
                <span>FREE</span>
              </div>

              <div className="flex justify-between">
                <span>Discount</span>
                <span>3%</span>
              </div>

              <div className="flex justify-between font-semibold text-lg">
                <span>Total to pay</span>
                <span>{total.toFixed(2)}</span>
              </div>

            </div>

            {/* SAVINGS BOX */}
            <div className="bg-[#DCE9D8] text-[#2E7D32] px-6 py-4 rounded-xl mb-6 font-medium">
              You will save ₹{(subtotal * 0.03).toFixed(0)} on this order
            </div>

            {/* ================= SUMMARY ================= */}
            <div className="mt-10 space-y-2 text-[#5E2B15]"></div>
            {/* CHECKOUT */}
            <div className="mt-6">
              <Link href="/checkout">
                <button className="w-full bg-[#819744] text-white py-3 font-semibold hover:bg-[#6f873a] transition">
                  Proceed to checkout
                </button>
              </Link>
            </div>
            
          </>
        )}

      </div>
    </div>
  );
}