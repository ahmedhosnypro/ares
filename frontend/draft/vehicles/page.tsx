"use client"
import Link from 'next/link';
import React, { useState } from 'react';

export default function Cars() {
  const [searchTerm, setSearchTerm] = useState("");

  const cars = [
    {
      name: "Toyota Crown 2023",
      image: "https://hips.hearstapps.com/hmg-prod/images/2023-toyota-crown-platinum-158-64c92955e93a7.jpg?crop=0.611xw:0.513xh;0.327xw,0.444xh&resize=1200:*",
    },
    {
      name: "Preus Prime SR",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399",
    },
    {
      name: "Toyota Camry",
      image: "https://images.unsplash.com/photo-1590362891991-f776e747a588",
    },
    {
      name: "BMW M4",
      image: "https://www.topgear.com/sites/default/files/2024/10/1-BMW-M4-review-2024-UK.jpg",
    },
    {
      name: "Mercedes C300",
      image: "https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9",
    },
    {
      name: "Audi A6",
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6",
    },
    {
      name: "Nissan Sunny",
      image: "https://ymimg1.b8cdn.com/resized/car_model/12996/pictures/15986492/webp_listing_main_2024-Nissan-SUNNY-Exterior-1.webp",
    },
    {
      name: "Hyundai Elantra",
      image: "https://ymimg1.b8cdn.com/resized/car_model/9477/pictures/13904870/webp_mobile_listing_main_ext-3231303031.webp",
    },
    {
      name: "Kia Sportage",
      image: "https://www.ccarprice.com/products/Kia_Sportage_LX_2024.jpg",
    },
    {
      name: "Porsche 911",
      image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/Porsche/911/11757/1762933836560/front-left-side-47.jpg",
    },
    {
      name: "Verna",
      image: "https://auto.economictimes.indiatimes.com/files/retail_files/verna-1504249732-prod-var.png",
    },
  ];

  const filteredCars = cars.filter((car) =>
    car.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // الخلفية الأساسية والنص
    <div className="p-6 min-h-screen w-[85%] mx-auto transition-colors duration-300 dark:bg-slate-900">
      
      {/* Search Input Section */}
      <div className="mb-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Explore Our Fleet</h1>
        <div className="relative w-full max-w-md group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors">
            <i className="fas fa-search"></i>
          </span>
          <input
            type="text"
            placeholder="Search for your favorite car..."
            className="w-full py-3 pl-11 pr-4 bg-white border border-gray-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:focus:ring-gray-600"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Found {filteredCars.length} results for "{searchTerm}"
          </p>
        )}
      </div>

      {/* Cars Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filteredCars.length > 0 ? (
          filteredCars.map((car, index) => (
            <div
              key={index}
              className="bg-slate-50 rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-300 dark:bg-gray-900 dark:shadow-none dark:border dark:border-gray-800"
            >
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-40 object-cover rounded-lg"
              />

              <h2 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-100">{car.name}</h2>

              <div className="flex items-center text-yellow-400 text-sm mt-1">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <span className="text-gray-500 ml-2 text-xs dark:text-gray-400">5.0 (1.5k)</span>
              </div>

              {/* Icons */}
              <div className="grid grid-cols-4 gap-3 mt-4 text-center text-gray-600 dark:text-gray-300 text-sm mb-6">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <i className="fas fa-user"></i>
                  <p className="text-[10px]">3 St</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <i className="fas fa-gas-pump"></i>
                  <p className="text-[10px]">Dsl</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <i className="fas fa-tachometer-alt"></i>
                  <p className="text-[10px]">15k</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <i className="fas fa-snowflake"></i>
                  <p className="text-[10px]">AC</p>
                </div>
              </div>

              <Link href={`/booking/id`} className="  px-2 border border-gray-400 rounded-lg py-2 hover:bg-gray-900 hover:text-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-100 dark:hover:text-black transition-all duration-500 cursor-pointer">
                Rent Now
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center py-20 col-span-full">
            <i className="fas fa-car-side text-6xl text-gray-200 dark:text-gray-800 mb-4"></i>
            <h3 className="text-xl text-gray-600 dark:text-gray-400">No cars found matching "{searchTerm}"</h3>
          </div>
        )}
      </div>
    </div>
  );
}