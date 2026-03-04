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
    const animationData = type === 'truck' ? truckLoading : generalLoading;

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full">
            <div style={{ width: size, height: size }}>
                <Lottie
                    animationData={animationData}
                    loop={true}
                    aria-label={type === 'truck' ? 'Truck loading animation' : 'Loading animation'}
                />
            </div>
            {message && (
                <div className="mt-4 text-center">
                    <p className="text-slate-900 font-extrabold uppercase tracking-[0.2em] text-xs animate-pulse">
                        {message}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LottieLoader;
