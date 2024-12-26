<template>
  <div id="app">
    <div class="container" :style="{ backgroundImage: `url(${currentBackground})` }">
      <div class="header">
        <h1>Conversții Fierbinți</h1>
        <p>Selectează un model pentru a începe conversația.</p>
      </div>
      <div class="paywall" v-if="!hasPaid">
        <p>Continuă conversația cu doar 30RON</p>
        <button @click="handlePayment">Pay Now</button>
      </div>
      <div class="circle-container" v-else>
        <div
          v-for="(agent, index) in agents"
          :key="index"
          class="circle"
          @click="toggleWidget(index)"
        >
          <img :src="agent.circleImage" alt="Agent Circle" class="circle-image" />
        </div>
        <div class="widget" v-if="agents.some(agent => agent.visible)" @click.stop>
          <elevenlabs-convai :agent-id="agents.find(agent => agent.visible).id"></elevenlabs-convai>
        </div>
        <div class="description" v-if="activeDescription">
          <p>{{ activeDescription }}</p>
        </div>
      </div>
      <!-- Mesaj pentru timpul rămas -->
      <div v-if="freeAccessTimeLeft > 0" class="free-access-message">
        Free access for {{ freeAccessTimeLeft }} seconds
      </div>
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
            "Alexandra este o enigmă fascinantă - cu o voce blândă care îți atinge sufletul și îți aprinde imaginația. Fiecare frază este o invitație către un joc seducător."
        },
        {
          id: "EU4z5Ma0f0dHLY6m9KSq",
          visible: false,
          background: "https://i.giphy.com/tY3S7GJlVOyhO0TOid.webp",
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
      hasPaid: false,
      currentBackground: "https://i.giphy.com/fygfeYhDOPrhTOHZ7v.webp",
      activeDescription: null,
      freeAccessTimeLeft: 60,
      timerId: null
    };
  },
  methods: {
    toggleWidget(index) {
        this.agents.forEach((agent, idx) => {
            agent.visible = idx === index ? !agent.visible : false;
            if (agent.visible) {
                this.currentBackground = agent.background;
                this.activeDescription = agent.description;
            }
        });
    },
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
    async checkPaymentStatus() {
        try {
            const sessionId = localStorage.getItem("sessionId");
            if (!sessionId) {
                console.error("Session ID is missing.");
                this.hasPaid = false;
                return;
            }

            const response = await fetch(`/api/check-payment-status?sessionId=${sessionId}`);
            const data = await response.json();

            if (data.hasPaid) {
                this.hasPaid = true;
                const paymentTimestamp = new Date().getTime();
                localStorage.setItem("paymentTimestamp", paymentTimestamp);
            } else {
                this.hasPaid = false;
                localStorage.removeItem("sessionId");
            }
        } catch (error) {
            console.error("Error checking payment status:", error.message);
            this.hasPaid = false;
            localStorage.removeItem("sessionId");
        }
    },
    initializeFreeAccess() {
        const freeAccessTimestamp = localStorage.getItem("freeAccessTimestamp");
        if (!freeAccessTimestamp) {
            // Dacă nu există un timestamp, setăm unul nou
            const currentTime = new Date().getTime();
            localStorage.setItem("freeAccessTimestamp", currentTime);
        }
    },
    validateFreeAccess() {
        const freeAccessTimestamp = localStorage.getItem("freeAccessTimestamp");
        if (freeAccessTimestamp) {
            const currentTime = new Date().getTime();
            const elapsedSeconds = (currentTime - freeAccessTimestamp) / 1000;

            if (elapsedSeconds >= 60) {
                // Free access a expirat, aplicăm paywall-ul
                this.hasPaid = false;
                localStorage.setItem("hasPaid", "false");
            } else {
                // Free access este activ
                this.hasPaid = true;
                localStorage.setItem("hasPaid", "true");
            }
        } else {
            // Dacă nu există timestamp, aplicăm paywall-ul
            this.hasPaid = false;
            localStorage.setItem("hasPaid", "false");
        }
    },
    validatePaymentTime() {
        const paymentTimestamp = localStorage.getItem("paymentTimestamp");
        if (paymentTimestamp) {
            const currentTime = new Date().getTime();
            const elapsedSeconds = (currentTime - paymentTimestamp) / 1000;

            if (elapsedSeconds >= 30) {
                // Timpul a expirat, activăm paywall-ul
                this.hasPaid = false;
                localStorage.setItem("hasPaid", "false");
                localStorage.removeItem("paymentTimestamp");
            } else {
                // Plata este activă, utilizatorul are acces
                this.hasPaid = true;
                localStorage.setItem("hasPaid", "true");
            }
        } else {
            this.validateFreeAccess(); // Validăm accesul gratuit dacă nu există un paymentTimestamp
        }
    },
    validatePaywallOnLoad() {
        // Inițializăm accesul gratuit dacă este prima vizită
        this.initializeFreeAccess();

        // Validăm starea paywall-ului
        this.validatePaymentTime();

        // Pornim un timer pentru verificări continue
        this.startPaywallTimer();
    },
    startPaywallTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
        }
        this.timerId = setInterval(() => {
            this.validatePaymentTime();
        }, 1000); // Verificare la fiecare secundă
    }
},
mounted() {
    const script = document.createElement("script");
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    // Inițializare completă
    this.validatePaywallOnLoad();
}
}
};
</script>

<style scoped>
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

.widget {
  position: fixed;
  top: 50%;
  left: 91%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

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
</style>
