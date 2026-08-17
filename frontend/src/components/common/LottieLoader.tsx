import React from 'react';
import Lottie from 'lottie-react';
import truckLoading from '../../assets/loading/Truck.json';
import generalLoading from '../../assets/loading/loading.json';

interface LottieLoaderProps {
    type?: 'truck' | 'general';
    message?: string;
    size?: number;
}

const LottieLoader: React.FC<LottieLoaderProps> = ({
    type = 'general',
    message,
    size = 200
}) => {
    // We replaced the Lottie animation with a safe CSS spinner 
    // because lottie-react was causing "Page Unresponsive" infinite loops.
    
    return (
        <div className="flex flex-col items-center justify-center p-8 w-full min-h-[300px]">
            <div 
                className="border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"
                style={{ width: size * 0.4, height: size * 0.4, maxWidth: '100px', maxHeight: '100px' }}
            ></div>
            {message && (
                <div className="mt-8 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs animate-pulse">
                        {message}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LottieLoader;
