import React from "react";

interface Product {
    name: string;
    imageUrl: string;
    description: string;
}

const products: Product[] = [
    {
        name: "Hollow Bricks",
        imageUrl: "https://imgs.search.brave.com/llh-hDe7LqvrT8EDBvPBW9iQBXA1Yrw-PM61vPhZSIU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hdGxh/cy1jb250ZW50LWNk/bi5waXhlbHNxdWlk/LmNvbS9zdG9jay1p/bWFnZXMvaG9sbG93/LWNvbmNyZXRlLWJy/aWNrLXNsYWItV0VX/blo2Qi02MDAuanBn",
        description:
            "Lightweight hollow bricks that provide excellent insulation and reduce construction cost. Aviable in various sizes(4,6,8,9).",
    },
    {
        name: "Red Stones",
        imageUrl: "https://imgs.search.brave.com/snitZN_heDVZtPGRCN2_NIKhVaO5viMYGpVktzhjn40/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTAv/NDY4LzY2Ni9zbWFs/bC9waWxlLW9mLXJl/ZC1icmlja3MtdGV4/dHVyZS1iYWNrZ3Jv/dW5kLWZyZWUtcGhv/dG8uSlBH",
        description:
            "Premium red stones for solid foundation and long durability in construction.",
    },
    {
        name: "Fly Ash Bricks",
        imageUrl: "https://imgs.search.brave.com/lBbarMG-JuTjHDAKu52khukYjEIGr_xSVQWSk-M1FCY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcy/LmV4cG9ydGVyc2lu/ZGlhLmNvbS9wcm9k/dWN0X2ltYWdlcy9i/Yy1zbWFsbC8yMDI0/LzEvMTk3Mzk0Ni9m/bHktYXNoLWJyaWNr/cy0xNzA0ODg1OTc2/LTcyNDM4MDMuanBn",
        description:
            "Eco-friendly fly ash bricks that are strong, sustainable, and cost-effective.",
    },
    {
        name: "M Sand & P Sand",
        imageUrl: "https://imgs.search.brave.com/IQnz-xqB5wkXOZTjTX5eGkvgVONXXUucIMHWZhG-Nfw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly81Lmlt/aW1nLmNvbS9kYXRh/NS9LSS9ZSi9ERy9B/TkRST0lELTExMTQz/NjU4Mi9pbWFnZXMt/Ny1qcGVnLTUwMHg1/MDAuanBlZw",
        description:
            "High quality M Sand and P Sand sourced from Karur, perfect for all construction needs.",
    },
    {
        name: "Jalli & Chips",
        imageUrl: "https://imgs.search.brave.com/ixOeKDMu15Qs0oUhbsJqsb0yZa2-1XCNFNEumfazP4w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly81Lmlt/aW1nLmNvbS9kYXRh/NS9YQy9XWi9UWC9B/TkRST0lELTYzNTA4/Njk5L3Byb2R1Y3Qt/anBlZy01MDB4NTAw/LmpwZw",
        description:
            "1/2 Jalli, 3/4 Jalli, 1 1/2 Jalli and Chips with high strength and clean material.",
    },
    {
        name: "Cement Supply",
        imageUrl: "https://imgs.search.brave.com/xtz8ITNwPSwIMmlfNbQCO002kPDjAsaR3YtnqDRtR94/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvOTI0/NzMyMTYyL3Bob3Rv/L3doaXRlLXBhcGVy/LXNhY2tzLWNlbWVu/dC1iYWctM2QtcmVu/ZGVyaW5nLmpwZz9z/PTYxMng2MTImdz0w/Jms9MjAmYz00Rmxz/aEtZalRwZ0thRjlD/R1ZWN2l1R0d4Zllu/dm9sempTZmcxTmhy/U2JBPQ",
        description:
            "Official dealer of Dalmia Cement, Maha Cement, and Chettinad Cement.",
    },
];

const ProductsPage: React.FC = () => {
    return (
        <section className="bg-black py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold text-white text-center mb-20">
                    Our Products
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    {products.map((product, index) => (
                        <div key={index} className="text-center">
                            {/* Image */}
                            <div className="w-full h-64 rounded-2xl overflow-hidden mb-6 bg-gray-900">
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>


                            {/* Title */}
                            <h2 className="text-2xl font-bold text-orange-400 mb-4">
                                {product.name}
                            </h2>

                            {/* Description */}
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {product.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductsPage;
