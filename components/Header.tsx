
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text pb-2">
                AI Content Detector
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
                Analyze text and images to determine their origin.
            </p>
        </header>
    );
};

export default Header;
