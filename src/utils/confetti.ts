export const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        // Create DOM elements for particles (Vanilla CSS performance)
        for (let i = 0; i < 5; i++) {
            createParticle();
        }
    }, 250);
};

function createParticle() {
    const p = document.createElement('div');
    const colors = ['#22c55e', '#ef4444', '#facc15', '#3b82f6', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    p.style.position = 'fixed';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.top = '-10px';
    p.style.width = Math.random() * 10 + 5 + 'px';
    p.style.height = p.style.width;
    p.style.backgroundColor = color;
    p.style.borderRadius = '50%';
    p.style.zIndex = '10000';
    p.style.pointerEvents = 'none';
    p.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    document.body.appendChild(p);

    const animation = p.animate([
        { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate3d(${Math.random() * 200 - 100}px, 100vh, 0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], {
        duration: Math.random() * 2000 + 1000,
        easing: 'cubic-bezier(0, .9, .57, 1)'
    });

    animation.onfinish = () => p.remove();
}
