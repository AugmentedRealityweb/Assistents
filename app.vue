<template>
  <div id="app">
    <div class="container" :style="{ backgroundImage: `url(${currentBackground})` }">
      <div class="header">
        <h1>Virtual Assistant Hub</h1>
        <p>Select an assistant by clicking on a circle below.</p>
      </div>
      <div class="paywall" v-if="!hasPaid">
        <p>Unlock full access for just 2 RON!</p>
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
      </div>
      <div v-if="currentAgent" class="widget-container">
        <div class="widget">
          <elevenlabs-convai :agent-id="currentAgent.id"></elevenlabs-convai>
        </div>
        <div class="agent-description">
          <p>{{ currentAgent.description }}</p>
        </div>
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
          id: "Hd79ohSgVoA9LkZcEhRG",
          name: "Angela",
          description:
            "Angela este seducția întruchipată – cu o voce caldă și un aer jucăuș, știe exact cum să te facă să zâmbești și să-ți simți inima bătând mai repede.",
          background: "https://i.giphy.com/xULW8LuH8tqB4H0Egg.webp",
          circleImage: "./poza.png",
        },
        {
          id: "EU4z5Ma0f0dHLY6m9KSq",
          name: "Patricia",
          description:
            "Patricia are un farmec irezistibil - Jucăușă și fermecătoare, își folosește inteligența și căldura pentru a te captiva complet.",
          background: "https://i.giphy.com/xTg8Bd9jyppDHgvjQQ.webp",
          circleImage: "./poza4.png",
        },
        {
          id: "sNEfrsQUklzPW2Hu6VGg",
          name: "Alexandra",
          description:
            "Alexandra este o enigmă fascinantă - cu o voce catifelată care îți atinge sufletul și îți aprinde imaginația.",
          background: "https://i.giphy.com/iIYcg9qJtPn34twSLU.webp",
          circleImage: "./poza3.png",
        },
        {
          id: "5mz0QGMTS6vciobpmiXO",
          name: "Claudia",
          description:
            "Claudia este senzualitatea întruchipată – o combinație perfectă de îndrăzneală și rafinament. Vocea ei îți mângâie simțurile, în timp ce spiritul ei glumeț îți aprinde dorința de a o cunoaște mai bine.",
          background: "https://i.giphy.com/TyijeM6uaGY00.webp",
          circleImage: "./poza2.png",
        },
      ],
      hasPaid: false,
      currentBackground: "https://i.giphy.com/TyijeM6uaGY00.webp",
      currentAgent: null,
    };
  },
  methods: {
    async handlePayment() {
      const stripe = await loadStripe(
        "pk_live_51LhHVFJOzg3eyu5LJRnplRv2AKh0MGJEew4HhNbn3Eu2LfJkbZUv2j4lFNxulY5ugbb6wrh07QCaX0djdFnQ8f7A00tyuYKXEL"
      );

      try {
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const { id } = await response.json();
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
          return;
        }

        const response = await fetch(
          `/api/check-payment-status?sessionId=${sessionId}`
        );
        const data = await response.json();

        if (data.hasPaid) {
          this.hasPaid = true;
        } else {
          this.hasPaid = false;
        }
      } catch (error) {
        console.error("Error checking payment status:", error.message);
      }
    },
    toggleWidget(index) {
      this.agents.forEach((agent, idx) => {
        if (index === idx) {
          agent.visible = !agent.visible;
          this.currentAgent = agent.visible ? agent : null;
          this.currentBackground = agent.background;
        } else {
          agent.visible = false;
        }
      });
    },
  },
  mounted() {
    const script = document.createElement("script");
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    this.checkPaymentStatus();
  },
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
  box-sizing: border-box;
  overflow: hidden;
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
  top: 30%;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 15px;
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

.widget-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.widget {
  position: fixed;
  top: 46%;
  left: 91%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

.agent-description {
  font-size: 1.2rem;
  color: white;
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.7);
}
</style>
