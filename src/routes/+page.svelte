<script lang="ts">
	import Header from '../components/header.svelte';
	import SEO from '../components/seo.svelte';	
	import Footer from '../components/footer.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<SEO
  title="Mr. Mythical - World of Warcraft Tools"
  description="Discover powerful World of Warcraft tools, including a Mythic+ Rating Calculator and Raid Encounter Analysis. Optimize your gameplay and achieve your goals with Mr. Mythical."
  image="https://mrmythical.com/Logo.png"
  keywords="World of Warcraft, Mythic Plus, Mythic+, Raid Analysis, WoW Tools"
/>
<Header />
<main class="container mx-auto px-4 py-8">
	<!-- Hero Section -->
	<section class="text-center mb-12">
	  <h1 class="text-4xl font-bold mb-4">Welcome to Mr. Mythical</h1>
	  <p class="text-lg mb-6">Optimize your World of Warcraft experience with powerful tools.</p>
	  <div class="flex justify-center gap-4">
	  </div>
	</section>
  
	<!-- Tools Section -->
	<section class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
	  <!-- Mythic+ Rating Calculator -->
	  <div class="bg-card shadow-md p-6 rounded-lg">
		<h3 class="text-2xl font-semibold mb-4">Mythic+ Rating Calculator</h3>
		<p class="mb-6">
		  Calculate required dungeon levels for your desired Mythic+ score. Import characters, edit plans, and share combinations.
		</p>
	<Button><a href="/rating-calculator" class="btn px-6 py-3 rounded-lg">Learn More</a></Button>
	  </div>
  
	  <!-- Raid Encounter Analysis -->
	  <div class="bg-card shadow-md p-6 rounded-lg">
		<h3 class="text-2xl font-semibold mb-4">Raid Encounter Analysis</h3>
		<p class="mb-6">
		  Visualize damage and healing graphs, overlay abilities, and analyze raid encounters using Warcraft Log Reports.
		</p>
	<Button><a href="/raid-analysis" class="btn px-6 py-3 rounded-lg">Learn More</a></Button>
	  </div>
	</section>
  
	<!-- About Section -->
	<section class="p-8 rounded-lg">
	  <h2 class="text-3xl font-bold mb-4">About Mr. Mythical</h2>
	  <p>
		We provide tools to help World of Warcraft players optimize their gameplay, from Mythic+ to raid encounters. Stay tuned for more features!
	  </p>
	</section>
  </main>
  
<Footer />
