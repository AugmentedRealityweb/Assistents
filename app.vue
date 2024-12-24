<template>
<div id="app">
  <div class="container" :style="{ backgroundImage: `url(${backgroundImage})` }">
    <div class="header">
      <h1>Virtual Assistant Hub</h1>
      <p>Select an assistant by clicking on a circle below.</p>
    </div>
    <div class="paywall" v-if="!hasPaid">
      <p>Unlock full access for just 1 RON!</p>
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
        <div class="widget" v-if="agent.visible">
          <elevenlabs-convai :agent-id="agent.id"></elevenlabs-convai>
        </div>
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
    backgroundImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDV8fHRlY2hub2xvZ3l8ZW58MHx8fHwxNjg4MjkwNzI4&ixlib=rb-4.0.3&q=80&w=1920",
    agents: [
      { id: "5mz0QGMTS6vciobpmiXO", visible: false },
      { id: "sNEfrsQUklzPW2Hu6VGg", visible: false },
      { id: "EU4z5Ma0f0dHLY6m9KSq", visible: false },
      { id: "Hd79ohSgVoA9LkZcEhRG", visible: false }
    ],
    positions: [],
    hasPaid: false
  };
},
methods: {
  async handlePayment() {
    const stripe = await loadStripe("pk_live_51LhHVFJOzg3eyu5LJRnplRv2AKh0MGJEew4HhNbn3Eu2LfJkbZUv2j4lFNxulY5ugbb6wrh07QCaX0djdFnQ8f7A00tyuYKXEL"); // Înlocuiește cu cheia ta publică Stripe
  
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  
    const { id } = await response.json();
  
    const result = await stripe.redirectToCheckout({ sessionId: id });
  
    if (result.error) {
      alert(result.error.message);
    } else {
      localStorage.setItem("hasPaid", true);
      this.hasPaid = true;
    }
  },
  toggleWidget(index) {
    this.agents[index].visible = !this.agents[index].visible;
  },
  dragStart(event, index) {
    event.dataTransfer.setData('index', index);
  },
  dragEnd(event, index) {
    const container = event.target.parentNode;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.positions[index] = { x, y };
    event.target.style.position = 'absolute';
    event.target.style.left = `${x}px`;
    event.target.style.top = `${y}px`;
  }
},
mounted() {
  // Inject the ElevenLabs script dynamically
  const script = document.createElement('script');
  script.src = "https://elevenlabs.io/convai-widget/index.js";
  script.async = true;
  script.type = "text/javascript";
  document.body.appendChild(script);

  this.positions = this.agents.map(() => ({ x: 0, y: 0 }));
  this.hasPaid = localStorage.getItem("hasPaid") === "true";
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
bottom: 20px;
width: 100%;
display: flex;
justify-content: center;
gap: 15px;
}

.circle {
width: 40px;
height: 40px;
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

.widget {
position: absolute;
top: -10px;
left: 400%;
transform: translateX(-50%);
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
