// dice.js - FIXED: Multi-row grid layout, 30+ dice fit perfectly
export class DiceRoller {
  constructor(sh) {
    this.sh = sh;
    this.isRolling = false;
    this.createContainer();
  }

  createContainer() {
    this.container = document.createElement("div");
    this.container.id = "dice-roller";
    this.container.style.cssText = `
      display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 90vw; max-width: 1200px; height: 70vh; max-height: 500px; 
      z-index: 10000; opacity: 0; transition: opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      background: rgba(20, 20, 40, 0.97);
      backdrop-filter: blur(50px); border-radius: 24px;
      border: 1px solid rgba(100, 200, 255, 0.2);
      box-shadow: 0 32px 64px rgba(0, 20, 80, 0.6);
       align-items: stretch; padding: 32px; gap: 40px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    document.body.appendChild(this.container);

    this.leftSide = this.createSide("left", "⚔️ ATTACK");
    this.rightSide = this.createSide("right", "🛡️ DEFENSE");
    this.container.appendChild(this.leftSide);
    this.container.appendChild(this.rightSide);
  }

  createSide(side, labelText) {
    const sideDiv = document.createElement("div");
    sideDiv.className = `${side}-side`;
    sideDiv.style.cssText = `
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 24px;
      min-height: 0;
    `;

    const label = document.createElement("div");
    label.textContent = labelText;
    label.style.cssText = `
      color: ${side === "left" ? "#ff6b6b" : "#4ecdc4"};
      font-size: 22px; font-weight: 800; letter-spacing: 2px;
      text-transform: uppercase; text-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;

    this[`${side}Dice`] = document.createElement("div");
    this[`${side}Dice`].className = `${side}-dice-grid`;
    this[`${side}Dice`].style.cssText = `
      flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(0, 1fr));
      grid-gap: 8px; place-items: center; padding: 20px; max-height: 320px;
      overflow: hidden; background: rgba(255,255,255,0.02);
      border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
    `;

    this[`${side}Sum`] = document.createElement("div");
    this[`${side}Sum`].textContent = "0";
    this[`${side}Sum`].style.cssText = `
      color: #ffffff; font-size: 44px; font-weight: 900; font-variant-numeric: tabular-nums;
      background: linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
      backdrop-filter: blur(20px); border-radius: 6px; border: 1px solid rgba(255,255,255,0.3);
      padding: 16px 32px; min-width: 100px; text-align: center;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    `;

    sideDiv.appendChild(label);
    sideDiv.appendChild(this[`${side}Dice`]);
    sideDiv.appendChild(this[`${side}Sum`]);
    return sideDiv;
  }

  async roll(leftCount = 0, rightCount = 0) {
    if (this.isRolling) return [0, 0];

    this.isRolling = true;
    this.show();

    // Smart scaling: 48px max, scales down to 28px for 20+ dice
    const leftSize = Math.max(28, 72 - Math.min(leftCount, 20) * 2);
    const rightSize = Math.max(28, 72 - Math.min(rightCount, 20) * 2);

    const leftResults = Array(leftCount)
      .fill(0)
      .map(() => Math.floor(Math.random() * 6) + 1);
    const rightResults = Array(rightCount)
      .fill(0)
      .map(() => Math.floor(Math.random() * 6) + 1);

    const leftSum = leftResults.reduce((a, b) => a + b, 0);
    const rightSum = rightResults.reduce((a, b) => a + b, 0);

    // Roll both sides simultaneously
    await Promise.all([
      this.rollSide("left", leftCount, leftResults, leftSize),
      this.rollSide("right", rightCount, rightResults, rightSize),
    ]);

    this.updateSum("left", leftSum);
    this.updateSum("right", rightSum);

    console.log(
      `🎲 Attack(${leftCount}): ${leftSum} | Defense(${rightCount}): ${rightSum}`,
    );

    setTimeout(() => {
      this.hide();
      this.isRolling = false;
    }, 1600);

    return [leftSum, rightSum];
  }

  async rollSide(side, count, results, dieSize) {
    const diceContainer = this[`${side}Dice`];
    diceContainer.innerHTML = "";

    // Set optimal grid columns based on dice count
    const cols = Math.min(8, Math.ceil(Math.sqrt(count || 1)));
    diceContainer.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    // Create dice instantly
    const dicePromises = results.map((result, i) => {
      const die = this.createDie(result, dieSize);
      diceContainer.appendChild(die);
      return this.animateDie(die, result, i * 15); // 15ms wave
    });

    await Promise.all(dicePromises);
  }

  createDie(result, size) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const viewSize = 100;
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${viewSize} ${viewSize}`);

    svg.style.cssText = `
      filter: drop-shadow(0 3px 12px rgba(0,0,0,0.4));
      transform-origin: center center;
      will-change: transform;
    `;

    const die = document.createElementNS("http://www.w3.org/2000/svg", "g");
    die.id = "die";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <radialGradient id="dieGrad">
        <stop offset="0%" stop-color="#fefcf8"/>
        <stop offset="60%" stop-color="#f8f4e8"/>
        <stop offset="100%" stop-color="#e8deb8"/>
      </radialGradient>
      <radialGradient id="pipGrad">
        <stop offset="0%" stop-color="#2d1b12"/>
        <stop offset="100%" stop-color="#110803"/>
      </radialGradient>
    `;
    die.appendChild(defs);

    const face = document.createElementNS("http://www.w3.org/2000/svg", "g");
    face.innerHTML = `
      <rect x="10" y="10" width="${viewSize - 20}" height="${viewSize - 20}" rx="8" 
            fill="url(#dieGrad)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    `;
    die.appendChild(face);

    svg.appendChild(die);
    svg.dataset.result = result;
    return svg;
  }

  animateDie(svg, finalResult, delay = 0) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const die = svg.querySelector("#die");

        // Professional casino roll: lift → spin → drop → settle
        svg.style.transform = "translateY(-30px) scale(0.9)";
        svg.style.transition = "none";

        requestAnimationFrame(() => {
          // Perfect spin timing
          svg.style.transform =
            "translateY(-30px) rotateX(520deg) rotateY(900deg) scale(1.1)";
          svg.style.transition =
            "transform 0.9s cubic-bezier(0.25, 0.1, 0.25, 1)";

          // Rapid face flicker
          let flicker = 0;
          const flickerInt = setInterval(() => {
            flicker++;
            const randFace = Math.floor(Math.random() * 6) + 1;
            this.updateDieFace(die.querySelector("g:last-child"), randFace);
          }, 60);

          setTimeout(() => {
            clearInterval(flickerInt);

            // Final face + drop
            this.updateDieFace(die.querySelector("g:last-child"), finalResult);
            setTimeout(() => {
              svg.style.transform =
                "translateY(0) rotateX(360deg) rotateY(0deg) scale(1)";
              svg.style.transition =
                "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
              setTimeout(resolve, 500);
            }, 50);
          }, 850);
        });
      }, delay);
    });
  }

  updateDieFace(face, number) {
    const pips = face.querySelectorAll("circle");
    pips.forEach((pip) => pip.remove());

    const positions = {
      1: [[50, 50]],
      2: [
        [25, 25],
        [75, 75],
      ],
      3: [
        [25, 25],
        [50, 50],
        [75, 75],
      ],
      4: [
        [25, 25],
        [25, 75],
        [75, 25],
        [75, 75],
      ],
      5: [
        [25, 25],
        [25, 75],
        [50, 50],
        [75, 25],
        [75, 75],
      ],
      6: [
        [25, 32],
        [25, 50],
        [25, 68],
        [75, 32],
        [75, 50],
        [75, 68],
      ],
    };

    positions[number].forEach(([x, y]) => {
      const pip = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      pip.setAttribute("cx", x);
      pip.setAttribute("cy", y);
      pip.setAttribute("r", 6);
      pip.setAttribute("fill", "url(#pipGrad)");
      face.appendChild(pip);
    });
  }

  updateSum(side, sum) {
    const sumEl = this[`${side}Sum`];
    sumEl.textContent = sum;
    sumEl.style.color = sum >= 20 ? "#ffd700" : "#ffffff";
  }

  show() {
    this.container.style.display = "flex";
    document.body.style.pointerEvents = "none";
    this.container.style.opacity = "1";
  }

  hide() {
    this.container.style.display = "";
    this.container.style.opacity = "0";
    setTimeout(() => (document.body.style.pointerEvents = "auto"), 400);
  }
}

export const _initDiceRoller = async (sh) => {
  sh.diceRoller = new DiceRoller(sh);
};
