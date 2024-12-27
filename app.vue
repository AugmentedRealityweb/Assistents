<template>
  <div id="app">
    <div class="container" :style="{ backgroundImage: `url(${currentBackground})` }">
      <div class="header">
        <h1>Conversații Fierbinți</h1>
        <p>Selectează un model pentru a începe conversația.</p>
      </div>

      <!-- Paywall: Apare DOAR dacă timpul gratuit a expirat și nu s-a plătit -->
      <div class="paywall" v-if="showPaywall">
        <p>Continuă conversația cu doar 30RON</p>
        <button @click="handlePayment">Pay Now</button>
      </div>

      <!-- Container cu "cercurile" agenților -->
      <div class="circle-container" v-else>
        <div
          v-for="(agent, index) in agents"
          :key="index"
          class="circle"
          @click="toggleWidget(index)"
        >
          <img :src="agent.circleImage" alt="Agent Circle" class="circle-image" />
        </div>

        <!-- Widget ElevenLabs (apare doar pentru agentul vizibil) -->
        <div class="widget" v-if="agents.some(agent => agent.visible)" @click.stop>
          <elevenlabs-convai :agent-id="agents.find(agent => agent.visible).id"></elevenlabs-convai>
        </div>

        <!-- Descriere agent selectat -->
        <div class="description" v-if="activeDescription">
          <p>{{ activeDescription }}</p>
        </div>
      </div>

      <!-- Mesaj care afișează timpul gratuit rămas, doar dacă mai există timp gratuit disponibil -->
      <div v-if="freeAccessTimeLeft > 0" class="free-access-message">
        Free access for {{ freeAccessTimeLeft }} seconds
      </div>

      <!-- Buton pentru a cere permisiunea (pe iOS 13+) de DeviceOrientation -->
      <button
        class="sensor-permission-btn"
        v-if="showOrientationButton"
        @click="requestOrientationPermission"
      >
        Activează mișcarea fulgilor
      </button>

      <!-- Canvas pentru fulgi de zăpadă -->
      <canvas id="snow-canvas"></canvas>
    </div>
  </div>
</template>

<script>
import { loadStripe } from "@stripe/stripe-js";

export default {
  data() {
    return {
      agents: [
        {
          id: "5mz0QGMTS6vciobpmiXO",
          visible: false,
          background: "https://i.giphy.com/CMCGp9yJG3pTuRcSGu.webp",
          circleImage: "./poza2.png",
          description:
            "Claudia este seducția întruchipată - o combinație perfectă de îndrăzneală și eleganță. Vocea ei îți mângâie simțurile, iar spiritul ei glumeț îți aprinde dorința."
        },
        {
          id: "sNEfrsQUklzPW2Hu6VGg",
          visible: false,
          background: "https://i.giphy.com/1qQ5lOKrgpai8EWGlo.webp",
          circleImage: "./poza3.png",
          description:
            "Delia este o enigmă fascinantă - cu o voce blândă care îți atinge sufletul și îți aprinde imaginația. Fiecare frază este o invitație către un joc seducător."
        },
        {
          id: "EU4z5Ma0f0dHLY6m9KSq",
          visible: false,
          background: "https://i.giphy.com/NzavBMIQ3CGxtMlOcv.webp",
          circleImage: "./poza4.png",
          description:
            "Patricia are un farmec irezistibil -  cu o voce care îți șoptește promisiuni subtile și te poartă într-o lume unde totul pare posibil. Jucăușă și fermecătoare."
        },
        {
          id: "Hd79ohSgVoA9LkZcEhRG",
          visible: false,
          background: "https://i.giphy.com/XR82em41ScZ45Uk1m5.webp",
          circleImage: "./poza.png",
          description:
            "Angela este seducția întruchipată - cu o voce caldă și un aer jucăuș, știe exact cum să te facă să zâmbești și să-ți simți inima bătând mai repede."
        }
      ],

      // --- Paywall & Timp Gratuit ---
      hasPaid: false,
      freeAccessActive: true,
      currentBackground: "https://i.giphy.com/fygfeYhDOPrhTOHZ7v.webp",
      activeDescription: null,
      freeAccessTimeLeft: 30, // Timp gratuit (200 secunde ca exemplu)
      paidAccessTimeLeft: 0,   // Timp plătit (în secunde)
      timerId: null,

      // --- Fulgii de zăpadă ---
      snowflakes: [],
      snowCanvas: null,
      snowCtx: null,
      orientationGamma: 0,
      orientationBeta: 0,
      numFlakes: 40,

      showOrientationButton: false // Afișăm butonul doar dacă e nevoie de permisiune iOS
    };
  },
  methods: {
    // === Gestiunea agenților și a background-ului ===
    toggleWidget(index) {
      this.agents.forEach((agent, idx) => {
        agent.visible = idx === index ? !agent.visible : false;
        if (agent.visible) {
          this.currentBackground = agent.background;
          this.activeDescription = agent.description;
        }
      });
    },

    // === Stripe Payment ===
    async handlePayment() {
      const stripe = await loadStripe(
        "pk_live_51LhHVFJOzg3eyu5LJRnplRv2AKh0MGJEew4HhNbn3Eu2LfJkbZUv2j4lFNxulY5ugbb6wrh07QCaX0djdFnQ8f7A00tyuYKXEL"
      );

      try {
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        const { id } = await response.json();
        if (!id) throw new Error("Session ID not received.");

        localStorage.setItem("sessionId", id);
        await stripe.redirectToCheckout({ sessionId: id });
      } catch (error) {
        console.error("Error during payment:", error.message);
      }
    },

    // === Timp gratuit ===
    initializeFreeAccess() {
      if (!localStorage.getItem("freeAccessUsed")) {
        localStorage.setItem("freeAccessUsed", "false");
        localStorage.setItem("freeAccessTimestamp", Date.now());
      }
    },
    validateFreeAccess() {
      const freeAccessUsed = localStorage.getItem("freeAccessUsed");
      if (freeAccessUsed === "true") {
        this.freeAccessActive = false;
        this.freeAccessTimeLeft = 0;
        return;
      }

      const freeAccessTimestamp = localStorage.getItem("freeAccessTimestamp");
      const elapsedSeconds = (Date.now() - freeAccessTimestamp) / 1000;
      const totalFree = 30; // 200 secunde ca exemplu

      if (elapsedSeconds >= totalFree) {
        localStorage.setItem("freeAccessUsed", "true");
        this.freeAccessActive = false;
        this.freeAccessTimeLeft = 0;
      } else {
        this.freeAccessTimeLeft = totalFree - Math.floor(elapsedSeconds);
        this.freeAccessActive = true;
      }
    },

    // === Check Payment Status ===
    async checkPaymentStatus() {
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        this.hasPaid = false;
        this.paidAccessTimeLeft = 0;
        return;
      }

      try {
        const response = await fetch(`/api/check-payment-status?sessionId=${sessionId}`);
        const data = await response.json();

        if (data.hasPaid) {
          this.hasPaid = true;
          if (!localStorage.getItem("paymentTimestamp")) {
            localStorage.setItem("paymentTimestamp", Date.now());
          }
        } else {
          this.hasPaid = false;
          this.paidAccessTimeLeft = 0;
        }
      } catch (error) {
        console.error("Error checking payment status:", error.message);
      }
    },
    validatePaidAccess() {
      const paymentTimestamp = localStorage.getItem("paymentTimestamp");
      if (!paymentTimestamp) {
        this.hasPaid = false;
        this.paidAccessTimeLeft = 0;
        return;
      }

      const elapsedSeconds = (Date.now() - paymentTimestamp) / 1000;
      // exemplu: 40 secunde în loc de 300, pentru test
      const totalPaid = 300;

      if (elapsedSeconds >= totalPaid) {
        this.hasPaid = false;
        localStorage.removeItem("paymentTimestamp");
        localStorage.removeItem("sessionId");
        this.paidAccessTimeLeft = 0;
      } else {
        this.paidAccessTimeLeft = totalPaid - Math.floor(elapsedSeconds);
      }
    },

    // === Fulgii de zăpadă ===
    initSnowflakes() {
      this.snowCanvas = document.getElementById("snow-canvas");
      this.snowCtx = this.snowCanvas.getContext("2d");

      this.snowCanvas.width = window.innerWidth;
      this.snowCanvas.height = window.innerHeight;

      for (let i = 0; i < this.numFlakes; i++) {
        this.snowflakes.push(this.createSnowflake());
      }
    },
    createSnowflake() {
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 4 + 1,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 2 + 1
      };
    },
    updateSnowflakes() {
      this.snowCtx.clearRect(0, 0, this.snowCanvas.width, this.snowCanvas.height);

      for (let i = 0; i < this.snowflakes.length; i++) {
        const flake = this.snowflakes[i];

        // Ajustăm scaling pt a fi mai vizibil
        flake.x += flake.speedX + this.orientationGamma;
        flake.y += flake.speedY + this.orientationBeta;

        // Resetare dacă iese din ecran
        if (flake.y > window.innerHeight) {
          flake.y = -flake.radius;
          flake.x = Math.random() * window.innerWidth;
        }
        if (flake.x > window.innerWidth) {
          flake.x = 0;
        } else if (flake.x < 0) {
          flake.x = window.innerWidth;
        }
        this.drawFlake(flake);
      }
      requestAnimationFrame(this.updateSnowflakes);
    },
    drawFlake(flake) {
      this.snowCtx.beginPath();
      this.snowCtx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      this.snowCtx.fillStyle = "white";
      this.snowCtx.fill();
    },
    handleDeviceOrientation(event) {
      // Debug: console.log(event.alpha, event.beta, event.gamma);
      this.orientationGamma = event.gamma / 20; // stânga-dreapta
      this.orientationBeta = event.beta / 40;   // față-spate
    },

    requestOrientationPermission() {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        DeviceOrientationEvent.requestPermission()
          .then((permissionState) => {
            if (permissionState === "granted") {
              window.addEventListener("deviceorientation", this.handleDeviceOrientation, true);
              this.showOrientationButton = false;
            } else {
              console.warn("Permisiune respinsă pentru deviceorientation!");
            }
          })
          .catch(console.error);
      } else {
        // Browsere care nu necesită permisiune specială (ex. Android mai vechi)
        window.addEventListener("deviceorientation", this.handleDeviceOrientation, true);
        this.showOrientationButton = false;
      }
    },

    // === Inițiere validări (Free Access + Pay Access) ===
    validatePaywallOnLoad() {
      this.initializeFreeAccess();
      this.validateFreeAccess();
      if (!this.freeAccessActive) {
        this.checkPaymentStatus().then(() => {
          this.validatePaidAccess();
        });
      }
      this.startPaywallTimer();
    },
    startPaywallTimer() {
      if (this.timerId) clearInterval(this.timerId);

      this.timerId = setInterval(() => {
        this.validateFreeAccess();
        if (!this.freeAccessActive) {
          this.validatePaidAccess();
        }
      }, 1000);
    }
  },
  computed: {
    showPaywall() {
      return !this.freeAccessActive && !this.hasPaid;
    }
  },
  mounted() {
    // Script ElevenLabs
    const script = document.createElement("script");
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    // Paywall & Timp gratuit
    this.validatePaywallOnLoad();

    // Fulgii de zăpadă
    this.initSnowflakes();
    // Legăm animația la `this` + pornim animația
    this.updateSnowflakes = this.updateSnowflakes.bind(this);
    requestAnimationFrame(this.updateSnowflakes);

    // Verificăm dacă trebuie să cerem permisiunea la deviceorientation (iOS 13+)
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      this.showOrientationButton = true; // arătăm butonul
    } else {
      // Ascultăm direct, dacă nu e iOS 13+
      window.addEventListener("deviceorientation", this.handleDeviceOrientation, true);
    }

    // Redimensionare canvas la resize
    window.addEventListener("resize", () => {
      this.snowCanvas.width = window.innerWidth;
      this.snowCanvas.height = window.innerHeight;
    });
  }
};
</script>

<style scoped>
/* ======= Layout general ======= */
.container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  margin: 0;
  padding: 0;
  position: relative;
  color: white;
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.7);
}

.header {
  margin-top: 20px;
  text-align: center;
}
.header h1 {
  font-size: 2.5rem;
  margin: 0;
  color: rgba(247, 0, 44, 0.8);
}
.header p {
  font-size: 1.2rem;
  margin: 10px 0;
}

/* ======= Paywall ======= */
.paywall {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
}
.paywall button {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

/* ======= Agenți ======= */
.circle-container {
  position: absolute;
  top: 20%;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 20px;
}
.circle {
  width: 50px;
  height: 50px;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  position: relative;
}
.circle-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* ======= Widget ======= */
.widget {
  position: fixed;
  top: 50%;
  left: 91%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

/* ======= Descriere ======= */
.description {
  padding: 10px;
  background: rgba(224, 200, 205, 0.57);
  color: white;
  border-radius: 25px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  width: 80%;
  max-width: 900px;
  margin: 0 auto;
  font-size: 1.2rem;
  position: fixed;
  bottom: 20%;
  left: 52%;
  transform: translateX(-50%);
  text-align: center;
  white-space: normal;
  line-height: 1.5;
}

/* ======= Timp gratuit (contor) ======= */
.free-access-message {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  z-index: 1000;
  text-align: center;
}

/* ======= Buton permisiune iOS ======= */
.sensor-permission-btn {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff9800;
  color: #fff;
  font-size: 1rem;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  z-index: 9999;
}

/* ======= Canvas fulgi de zăpadă ======= */
#snow-canvas {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none; /* nu afectează interacțiunea cu UI */
  z-index: 2;           /* să fie deasupra background-ului, sub agenți */
  width: 100vw;
  height: 100vh;
}
</style>
