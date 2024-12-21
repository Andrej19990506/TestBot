import confetti from 'canvas-confetti';

export const fireConfetti = () => {
    // Основные цвета
    const colors = ['#e67e22', '#f39c12', '#f1c40f', '#2ecc71', '#3498db'];

    // Первый большой залп по центру
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors,
        zIndex: 999999,
        scalar: 1.2,
        gravity: 1
    });

    // Залп слева
    setTimeout(() => {
        confetti({
            particleCount: 80,
            angle: 60,
            spread: 70,
            origin: { x: 0, y: 0.65 },
            colors: colors,
            zIndex: 999999,
            scalar: 1.2
        });
    }, 200);

    // Залп справа
    setTimeout(() => {
        confetti({
            particleCount: 80,
            angle: 120,
            spread: 70,
            origin: { x: 1, y: 0.65 },
            colors: colors,
            zIndex: 999999,
            scalar: 1.2
        });
    }, 400);

    // Финальный залп по центру
    setTimeout(() => {
        confetti({
            particleCount: 120,
            spread: 120,
            origin: { y: 0.7 },
            colors: colors,
            zIndex: 999999,
            scalar: 1,
            drift: 1,
            ticks: 300
        });
    }, 600);

    // Дополнительные маленькие залпы
    const smallBursts = () => {
        confetti({
            particleCount: 30,
            spread: 50,
            origin: { x: Math.random(), y: Math.random() - 0.2 },
            colors: colors,
            ticks: 200
        });
    };

    // Запускаем маленькие залпы с интервалом
    setTimeout(() => {
        smallBursts();
        setTimeout(smallBursts, 200);
        setTimeout(smallBursts, 400);
    }, 800);
}; 