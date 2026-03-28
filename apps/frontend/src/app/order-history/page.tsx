"use client";

import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faCircle } from "@fortawesome/free-solid-svg-icons";

export default function OrderHistoryPage() {

  const orders = [
    {
      id: 1,
      name: "Vitamin C Facewash",
      price: 699,
      img: "/img/facewash.png",
      status: "Arriving tomorrow by 11 pm",
      sub: "Your item has been received in the hub nearest to you",
      color: "text-green-500",
    },
    {
      id: 2,
      name: "Apple Berry Facewash",
      price: 699,
      img: "/img/facewash.png",
      status: "Delivered on Fri Mar 27",
      sub: "Your item has been delivered",
      color: "text-green-500",
    },
    {
      id: 3,
      name: "Glow Cleanser",
      price: 699,
      img: "/img/facewash.png",
      status: "Payment not yet confirmed from the bank",
      sub: "Please check again after some time",
      color: "text-yellow-500",
    },
    {
      id: 4,
      name: "Skin Serum",
      price: 899,
      img: "/img/facewash.png",
      status: "Refund Completed",
      sub: "",
      color: "text-red-500",
    },
  ];

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-10 px-6">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <Link href="/profile ">
          <div className="flex items-center gap-3 text-[#5E2B16] mb-6 cursor-pointer">
            <FontAwesomeIcon icon={faArrowLeftLong} />
            <h1 className="text-[28px] font-semibold">Order History</h1>
          </div>
        </Link>

        <div className="border-t border-[#D6C9B6] mb-6" />

        {/* MAIN GRID */}
        <div className="grid grid-cols-[250px_1fr] gap-6">

          {/* ================= LEFT FILTER ================= */}
          <div className="bg-white p-4 rounded shadow-sm">

            <h2 className="font-semibold mb-4">Filters</h2>

            {/* ORDER STATUS */}
            <div className="mb-6">
              <p className="text-sm font-semibold mb-2">ORDER STATUS</p>
              {["On the way", "Delivered", "Cancelled", "Returned"].map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm mb-2">
                  <input type="checkbox" />
                  {item}
                </label>
              ))}
            </div>

            {/* ORDER TIME */}
            <div>
              <p className="text-sm font-semibold mb-2">ORDER TIME</p>
              {["Last 30 days", "2024", "2023", "Older"].map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm mb-2">
                  <input type="checkbox" />
                  {item}
                </label>
              ))}
            </div>

          </div>

          {/* ================= RIGHT CONTENT ================= */}
          <div>

            {/* SEARCH */}
            <div className="flex gap-3 mb-6">
              <input
                placeholder="Search your orders here"
                className="flex-1 p-3 border rounded"
              />
              <button className="bg-[#5E2B15] text-white px-6 rounded hover:bg-[#4a1f10] transition">
                Search Orders
              </button>
            </div>

            {/* ORDER LIST */}
            <div className="space-y-4">

              {orders.map((order) => (
                <div key={order.id} className="bg-white p-4 rounded shadow-sm grid grid-cols-[1fr_120px_320px] items-center gap-4">

                  {/* LEFT */}
                  <div className="flex gap-4 items-center">

                    <Image
                        src={order.img}
                        alt="product"
                        width={80}
                        height={80}
                        className="rounded"
                    />

                    <div>
                      <h3 className="font-medium">{order.name}</h3>
                      <p className="text-sm text-gray-500">Color: Brown</p>
                    </div>

                  </div>

                  {/* PRICE */}
                  <div className="font-medium text-center font-semibold">
                    ₹{order.price}
                  </div>

                  {/* STATUS */}
                  {/* <div className="w-[300px]">

                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCircle} className={`${order.color} text-xs`} />
                      <p className="font-medium">{order.status}</p>
                    </div>

                    {order.sub && (
                      <p className="text-sm text-gray-500 mt-1">
                        {order.sub}
                      </p>
                    )}

                  </div> */}

                   {/* STATUS */}
                    <div>
                        <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCircle} className={`${order.color} text-xs`} />
                        <p className="font-medium">{order.status}</p>
                        </div>

                        {order.sub && (
                        <p className="text-sm text-gray-500 mt-1">
                            {order.sub}
                        </p>
                        )}
                    </div>

                </div>
              ))}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}