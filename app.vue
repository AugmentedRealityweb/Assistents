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
      hasPaid: false,
      freeAccessActive: true, // Controlează dacă timpul gratuit este activ
      currentBackground: "https://i.giphy.com/fygfeYhDOPrhTOHZ7v.webp",
      activeDescription: null,
      freeAccessTimeLeft: 60, // Timp gratuit (60 secunde)
      paidAccessTimeLeft: 0, // Timp plătit (în secunde)
      timerId: null
    };
  },
  methods: {
    // Afișează/ascunde widgetul agentului selectat și schimbă background + descriere
    toggleWidget(index) {
      this.agents.forEach((agent, idx) => {
        agent.visible = idx === index ? !agent.visible : false;
        if (agent.visible) {
          this.currentBackground = agent.background;
          this.activeDescription = agent.description;
        }
      });
    },

    // Inițierea plații folosind Stripe
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

        // Salvăm ID-ul în localStorage pentru a verifica ulterior statusul plății
        localStorage.setItem("sessionId", id);

        // Redirecționăm către pagina de checkout
        await stripe.redirectToCheckout({ sessionId: id });
      } catch (error) {
        console.error("Error during payment:", error.message);
      }
    },

    // Marchează dacă utilizatorul a folosit deja accesul gratuit
    initializeFreeAccess() {
      if (!localStorage.getItem("freeAccessUsed")) {
        // Dacă nu există cheie, setăm că nu a fost folosit încă
        localStorage.setItem("freeAccessUsed", "false");
        // Timpul la care a început accesul gratuit
        localStorage.setItem("freeAccessTimestamp", Date.now());
      }
    },

    // Verifică dacă accesul gratuit a expirat
    validateFreeAccess() {
      const freeAccessUsed = localStorage.getItem("freeAccessUsed");
      if (freeAccessUsed === "true") {
        this.freeAccessActive = false;
        this.freeAccessTimeLeft = 0;
        return;
      }

      const freeAccessTimestamp = localStorage.getItem("freeAccessTimestamp");
      const elapsedSeconds = (Date.now() - freeAccessTimestamp) / 1000;

      // Dacă au trecut 60 de secunde, marchem accesul gratuit ca folosit
      if (elapsedSeconds >= 20) {
        localStorage.setItem("freeAccessUsed", "true");
        this.freeAccessActive = false; 
        this.freeAccessTimeLeft = 0;
      } else {
        // Actualizăm timpul gratuit rămas
        this.freeAccessTimeLeft = 20 - Math.floor(elapsedSeconds);
        this.freeAccessActive = true;
      }
    },

    // Verifică statusul plății pe baza sessionId stocat în localStorage
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
          // Dacă plata este confirmată și nu s-a salvat timestampul, îl salvăm acum
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

    // Verifică dacă timpul plătit (5 minute = 300 secunde) a expirat
    validatePaidAccess() {
      const paymentTimestamp = localStorage.getItem("paymentTimestamp");
      if (!paymentTimestamp) {
        this.hasPaid = false;
        this.paidAccessTimeLeft = 0;
        return;
      }

      const elapsedSeconds = (Date.now() - paymentTimestamp) / 1000;

      // Dacă au trecut 300 de secunde (5 minute) de la plata anterioară, accesul plătit expiră
      if (elapsedSeconds >= 40) {
        this.hasPaid = false;
        localStorage.removeItem("paymentTimestamp");
        // Ştergem și sessionId pentru a nu mai fi considerat "plătit" la refresh
        localStorage.removeItem("sessionId");
        this.paidAccessTimeLeft = 0;
      } else {
        // Calculăm timpul plătit rămas
        this.paidAccessTimeLeft = 40 - Math.floor(elapsedSeconds);
      }
    },

    // Inițierea validărilor la încărcarea paginii
    validatePaywallOnLoad() {
      // Inițializăm starea accesului gratuit (o singură dată per utilizator)
      this.initializeFreeAccess();

      // Verificăm dacă accesul gratuit este încă valabil
      this.validateFreeAccess();

      // Dacă accesul gratuit a expirat, verificăm plata
      if (!this.freeAccessActive) {
        this.checkPaymentStatus().then(() => {
          this.validatePaidAccess();
        });
      }

      // Pornim un timer care validează permanent starea paywall-ului
      this.startPaywallTimer();
    },

    // Timerul care face actualizări la fiecare secundă
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
    // Paywall-ul apare doar după expirarea timpului gratuit și dacă nu există acces plătit
    showPaywall() {
      return !this.freeAccessActive && !this.hasPaid;
    }
  },
  mounted() {
    // Încărcăm scriptul pentru ElevenLabs
    const script = document.createElement("script");
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    // Facem validările și pornim timerul
    this.validatePaywallOnLoad();
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
