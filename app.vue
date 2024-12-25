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
      activeDescription: null
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
          headers: { "Content-Type": "application/json" }
        });

        const { id } = await response.json();
        localStorage.setItem("sessionId", id);
        localStorage.setItem("paymentTimestamp", new Date().getTime());
        await stripe.redirectToCheckout({ sessionId: id });
      } catch (error) {
        console.error("Error during payment:", error.message);
      }
    },
    toggleWidget(index) {
      this.agents.forEach((agent, idx) => {
        agent.visible = idx === index ? !agent.visible : false;
        if (agent.visible) {
          this.currentBackground = agent.background;
          this.activeDescription = agent.description;
        }
      });
    },
    validatePaymentTime() {
      const paymentTimestamp = localStorage.getItem("paymentTimestamp");
      if (paymentTimestamp) {
        const currentTime = new Date().getTime();
        const elapsedMinutes = (currentTime - paymentTimestamp) / (1000 * 60);
        if (elapsedMinutes >= 0.5) {
          this.hasPaid = false;
          localStorage.removeItem("paymentTimestamp");
        } else {
          this.hasPaid = true;
        }
      } else {
        this.hasPaid = false;
      }
    },
    async checkPaymentStatus() {
      try {
        const sessionId = localStorage.getItem("sessionId");
        if (!sessionId) return;

        const response = await fetch(`/api/check-payment-status?sessionId=${sessionId}`);
        const data = await response.json();
        this.hasPaid = data.hasPaid;
      } catch (error) {
        console.error("Error checking payment status:", error.message);
      }
    }
  },
  mounted() {
    this.validatePaymentTime();
    this.checkPaymentStatus();
  }
};
</script>
