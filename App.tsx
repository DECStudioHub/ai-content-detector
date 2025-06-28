
import React from 'react';
import Detector from './components/Detector';
import Header from './components/Header';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/50 z-0"></div>
       <div className="relative z-10 w-full max-w-4xl">
            <Header />
            <main>
                <Detector />
            </main>
       </div>
    </div>
  );
}

export default App;
