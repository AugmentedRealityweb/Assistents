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
          draggable="true"
          @dragstart="dragStart($event, index)"
          @dragend="dragEnd($event, index)"
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
          background: "https://i.giphy.com/l4FGE5EZOqikBWaqc.webp",
          circleImage: "./poza2.png",
          description:
            "Claudia este seducția întruchipată - o combinație perfectă de îndrăzneală și rafinament. Vocea ei îți mângâie simțurile, în timp ce spiritul ei glumeț îți aprinde dorința de a o cunoaște mai bine."
        },
        {
          id: "sNEfrsQUklzPW2Hu6VGg",
          visible: false,
          background: "https://i.giphy.com/iIYcg9qJtPn34twSLU.webp",
          circleImage: "./poza3.png",
          description:
            "Alexandra este o enigmă fascinantă - cu o voce blândă care îți atinge sufletul și îți aprinde imaginația. Fiecare frază este o invitație către un joc seducător al minții și emoțiilor."
        },
        {
          id: "EU4z5Ma0f0dHLY6m9KSq",
          visible: false,
          background: "https://i.giphy.com/xTg8Bd9jyppDHgvjQQ.webp",
          circleImage: "./poza4.png",
          description:
            "Patricia are un farmec irezistibil -  cu o voce care îți șoptește promisiuni subtile și te poartă într-o lume unde totul pare posibil. Jucăușă și fermecătoare."
        },
        {
          id: "Hd79ohSgVoA9LkZcEhRG",
          visible: false,
          background: "https://i.giphy.com/xULW8LuH8tqB4H0Egg.webp",
          circleImage: "./poza.png",
          description:
            "Angela este seducția întruchipată - cu o voce caldă și un aer jucăuș, știe exact cum să te facă să zâmbești și să-ți simți inima bătând mai repede."
        }
      ],
      positions: [],
      hasPaid: false,
      currentBackground: "https://i.giphy.com/l4FGE5EZOqikBWaqc.webp", // Fundal implicit
      activeDescription: null // Descriere activă
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
        localStorage.setItem("sessionId", id); // Salvăm `sessionId` în localStorage
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
          this.currentBackground = agent.background;
          this.activeDescription = agent.visible ? agent.description : null;
        } else {
          agent.visible = false;
        }
      });
    },
    dragStart(event, index) {
      event.dataTransfer.setData("index", index);
    },
    dragEnd(event, index) {
      const container = event.target.parentNode;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.positions[index] = { x, y };
      event.target.style.position = "absolute";
      event.target.style.left = `${x}px`;
      event.target.style.top = `${y}px`;
    }
  },
  mounted() {
    const script = document.createElement("script");
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    this.positions = this.agents.map(() => ({ x: 0, y: 0 }));
    this.checkPaymentStatus(); // Verificăm starea plăți la montarea componentului
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
  border: 5px solid black;
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
  top: 20%;
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
  animation: float 7s ease-in-out infinite;
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
  top: 45%;
  left: 91%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

.description {
  padding: 10px;
  background: rgba(211, 199, 205, 0.56);
  color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  width: 80%; /* Ensures the width spans a good horizontal space */
  max-width: 900px; /* Restricts the width for readability */
  margin: 0 auto;
  font-size: 1.2rem;
  position: fixed;
  bottom: 20%; /* Positions the description box at the bottom */
  left: 52%;
  transform: translateX(-50%);
  text-align: center; /* Centers the text inside the box */
  white-space: normal; /* Allows the text to wrap */
  line-height: 1.5; /* Improves line spacing for readability */
}

@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
