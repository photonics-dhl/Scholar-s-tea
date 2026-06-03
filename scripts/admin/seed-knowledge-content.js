/**
 * Batch seed high-value academic papers into the knowledge base.
 *
 * Run: cd ~/scholars && NODE_PATH=~/scholars/server/node_modules node scripts/admin/seed-knowledge-content.js
 */
const { Pool } = require('pg')
const crypto = require('crypto')
const pool = new Pool({ host: '127.0.0.1', port: 5432, database: 'scholars_tea', user: 'zju321' })

function generateUUID() {
  return crypto.randomUUID()
}

// High-value papers curated for the Scholar's Tea community
// Focus: optics/photonics, AI/ML, materials science, physics
const PAPERS = [
  // ============================================
  // Optics / Photonics (6 papers)
  // ============================================
  {
    title: 'Dielectric Metasurfaces for Complete Control of Phase and Polarization with Subwavelength Spatial Resolution and High Transmission',
    source: 'publication',
    discipline: 'optics',
    subDiscipline: 'nano-optics',
    tags: ['Metasurface', 'Nanostructure', 'Phase', 'Polarization', 'Original Research'],
    authors: ['Nanfang Yu', 'Patrice Genevet', 'Federico Aieta', 'Mikhail A. Kats', 'Romain Blanchard', 'Guillaume Aoust', 'Jean-Philippe Tetienne', 'Zeno Gaburro', 'Federico Capasso'],
    year: 2012,
    url: 'https://www.nature.com/articles/nnano.2012.172',
    venue: 'Nature Nanotechnology',
    content: `【Core Contribution】This paper demonstrates the first dielectric (silicon) metasurface that achieves complete control over both the phase and polarization of light with subwavelength spatial resolution and near-unity transmission efficiency, overcoming the limitations of plasmonic metasurfaces which suffer from high ohmic losses.

【Method Highlights】The authors use arrays of V-shaped silicon nanoantennas with spatially varying geometries. By engineering the in-plane asymmetry and orientation of each antenna, they independently control the phase retardation for orthogonal polarization components, enabling arbitrary wavefront shaping and polarization conversion.

【Key Conclusions】The silicon metasurface achieves over 70% transmission efficiency in the near-infrared regime, compared to less than 20% for plasmonic counterparts. They demonstrate a high-performance hologram and a polarization beam splitter as proof-of-concept applications.

【Limitations and Insights】The working bandwidth is relatively narrow due to resonant operation. This work opened the floodgates for high-efficiency flat optics, leading to commercial applications in compact imaging systems, AR/VR displays, and lightweight optical components.`,
  },
  {
    title: 'Topological Photonics',
    source: 'publication',
    discipline: 'photonics',
    subDiscipline: 'topological-photonics',
    tags: ['Topological Material', 'Photonic Crystal', 'Original Research', 'Theory Paper'],
    authors: ['Ling Lu', 'John D. Joannopoulos', 'Marin Soljacic'],
    year: 2014,
    url: 'https://www.nature.com/articles/nphoton.2014.248',
    venue: 'Nature Photonics',
    content: `【Core Contribution】This seminal review introduces the concept of topological photonics — bringing the robust edge states of topological insulators from condensed matter physics into the photonic domain. It establishes the theoretical framework for photonic systems that support unidirectional, backscattering-immune light propagation.

【Method Highlights】The authors map the topological classification of electronic band structures onto photonic crystals and coupled resonator optical waveguides (CROWs). They describe how breaking time-reversal symmetry (via magneto-optical effects) or crystalline symmetries can open topological bandgaps supporting chiral edge states.

【Key Conclusions】Topological photonic edge states are robust against disorder, defects, and fabrication imperfections — a dramatic advantage over conventional waveguides. The paper surveys early experimental realizations in gyromagnetic photonic crystals and silicon-ring CROWs.

【Limitations and Insights】The need for magnetic materials or dynamic modulation limits practical implementations. This field has since expanded to Floquet topological insulators, Weyl points, and higher-order topological phases, with applications in robust optical delay lines, topological lasers, and quantum photonic devices.`,
  },
  {
    title: 'Deep Learning with Coherent Nanophotonic Circuits',
    source: 'publication',
    discipline: 'photonics',
    subDiscipline: 'optical-computing',
    tags: ['Optical Computing', 'Deep Learning', 'Nanostructure', 'Original Research'],
    authors: ['Yichen Shen', 'Nicholas C. Harris', 'Scott Skirlo', 'Mihika Prabhu', 'Tom Baehr-Jones', 'Michael Hochberg', 'Xin Sun', 'Shijie Zhao', 'Hugo Larochelle', 'Dirk Englund', 'Marin Soljacic'],
    year: 2017,
    url: 'https://www.nature.com/articles/s41566-017-0001-5',
    venue: 'Nature Photonics',
    content: `【Core Contribution】This work presents the first programmable nanophotonic processor that performs deep learning inference at the speed of light. The silicon photonic chip implements a matrix-vector multiplication engine that can be reconfigured to recognize vowel sounds with competitive accuracy.

【Method Highlights】The chip uses a mesh of tunable Mach-Zehnder interferometers (MZIs) arranged in a triangular network to implement arbitrary unitary transformations. Phase shifters are controlled via thermal or electro-optic tuning, enabling real-time reconfiguration of the network weights.

【Key Conclusions】The photonic neural network achieves 77% accuracy on vowel recognition, comparable to a conventional 64-bit digital computer. Critically, the computation is performed at the speed of light with minimal energy consumption per multiply-accumulate operation.

【Limitations and Insights】The prototype is small-scale (4 input neurons, 4 outputs). Scaling to practical deep networks requires integrating thousands of MZIs with low loss and high-precision tuning. This work sparked intense interest in photonic accelerators for AI, with subsequent advances in photonic tensor cores and neuromorphic photonic systems.`,
  },
  {
    title: 'Silicon Photonics: The State of the Art',
    source: 'publication',
    discipline: 'photonics',
    subDiscipline: 'integrated-photonics',
    tags: ['Optical Fiber', 'Waveguide', 'Optoelectronic Devices', 'Review'],
    authors: ['Graham T. Reed', 'Andrew P. Knights'],
    year: 2008,
    url: 'https://doi.org/10.1109/JPROC.2008.927715',
    venue: 'Proceedings of the IEEE',
    content: `【Core Contribution】This comprehensive review article establishes silicon photonics as a mature platform for integrated optical systems. It surveys the fundamental physics, device technologies, and system-level applications that have enabled silicon to become the dominant material for photonic integration.

【Method Highlights】The paper covers key building blocks: silicon-on-insulator (SOI) waveguides with submicron confinement, electro-optic modulators based on carrier injection/depletion, Ge-on-Si photodetectors, and fiber-to-chip coupling strategies. It also discusses CMOS-compatible fabrication processes that enable mass production.

【Key Conclusions】Silicon photonics offers a unique combination of high refractive index contrast (enabling compact devices), compatibility with CMOS electronics, and access to mature manufacturing infrastructure. Performance metrics for modulators, detectors, and passive components have reached levels suitable for commercial transceivers.

【Limitations and Insights】Silicon lacks efficient light sources (no direct bandgap) and electro-optic coefficient. Hybrid integration with III-V lasers and nonlinear materials remains an active research frontier. This review remains a foundational reference for students and researchers entering integrated photonics.`,
  },
  {
    title: 'Nano-Optics of Surface Plasmon Polaritons',
    source: 'publication',
    discipline: 'optics',
    subDiscipline: 'nano-optics',
    tags: ['Plasmonics', 'Nanostructure', 'Waveguide', 'Review'],
    authors: ['Rashid Zia', 'Jonathan A. Schuller', 'Anu Chandran', 'Mark L. Brongersma'],
    year: 2006,
    url: 'https://doi.org/10.1039/b513696k',
    venue: 'Journal of Optics A',
    content: `【Core Contribution】This influential review provides a comprehensive theoretical and experimental treatment of surface plasmon polariton (SPP) modes at metal-dielectric interfaces. It establishes the conceptual framework for plasmonic waveguides, subwavelength confinement, and nanoscale optical field enhancement.

【Method Highlights】The authors present analytical solutions for SPP propagation at single and multiple interfaces, derive dispersion relations for various waveguide geometries (strip, slot, gap plasmon waveguides), and discuss experimental techniques for exciting and characterizing plasmonic modes including near-field optical microscopy and leakage radiation imaging.

【Key Conclusions】SPPs enable optical mode confinement far below the diffraction limit (to ~10 nm scales), opening applications in nanophotonic circuits, enhanced spectroscopy (SERS), and subwavelength imaging. However, plasmonic systems suffer from intrinsic ohmic losses in metals that limit propagation lengths.

【Limitations and Insights】The trade-off between confinement and loss is fundamental. This review helped define the field of plasmonics and continues to inform research on hybrid plasmonic-photonic systems, hyperbolic metamaterials, and epsilon-near-zero materials that seek to overcome these limitations.`,
  },
  {
    title: 'A Broadband Achromatic Metalens for Focusing and Imaging in the Visible',
    source: 'publication',
    discipline: 'optics',
    subDiscipline: 'nano-optics',
    tags: ['Metasurface', 'Super-resolution', 'Nanostructure', 'Original Research'],
    authors: ['Wei Ting Chen', 'Alexander Y. Zhu', 'Vyshakh Sanjeev', 'Mohammadreza Khorasaninejad', 'Zhujun Shi', 'Eric Lee', 'Federico Capasso'],
    year: 2018,
    url: 'https://www.nature.com/articles/s41565-017-0034-6',
    venue: 'Nature Nanotechnology',
    content: `【Core Contribution】This paper reports the first achromatic metalens that focuses and images across the entire visible spectrum (470-670 nm) without chromatic aberration. This breakthrough addresses one of the most fundamental limitations of diffractive optics: wavelength-dependent focal length.

【Method Highlights】The authors use dielectric (TiO2) nanofins with carefully engineered dimensions and orientations. By exploiting the principle of dispersive phase compensation, adjacent nanofins provide frequency-dependent phase shifts that collectively cancel the chromatic dispersion of the lens, achieving constant focal length across the visible band.

【Key Conclusions】The metalens achieves diffraction-limited focusing with numerical aperture NA = 0.2 over a 200 nm bandwidth. Imaging experiments demonstrate sharp, color-corrected pictures of test patterns and biological samples, rivaling commercial refractive objectives in a form factor thousands of times thinner.

【Limitations and Insights】The numerical aperture is modest compared to high-NA objectives, and the efficiency is limited by the discrete phase sampling. This work catalyzed a wave of research on achromatic and apochromatic metalenses, with recent advances extending to near-IR and large-aperture designs for smartphone cameras and endoscopic imaging.`,
  },

  // ============================================
  // AI / Machine Learning (4 papers)
  // ============================================
  {
    title: 'ImageNet Classification with Deep Convolutional Neural Networks',
    source: 'publication',
    discipline: 'artificial-intelligence',
    subDiscipline: 'computer-vision',
    tags: ['Deep Learning', 'Computer Vision', 'Original Research'],
    authors: ['Alex Krizhevsky', 'Ilya Sutskever', 'Geoffrey E. Hinton'],
    year: 2012,
    url: 'https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html',
    venue: 'NeurIPS',
    content: `【Core Contribution】AlexNet won the 2012 ImageNet Large Scale Visual Recognition Challenge (ILSVRC) by an unprecedented margin, achieving 15.3% top-5 error compared to 26.2% for the second-place entry. This result ignited the modern deep learning revolution and demonstrated that large CNNs trained on massive datasets could dramatically outperform hand-engineered features.

【Method Highlights】The network has 8 layers (5 convolutional, 3 fully connected) with 60 million parameters. Key innovations include ReLU activation functions (enabling faster training than tanh/sigmoid), dropout regularization to prevent overfitting, and GPU training with data parallelism across two GTX 580 GPUs.

【Key Conclusions】Deep convolutional networks, when trained with sufficient data and compute, learn hierarchical feature representations automatically — from edge detectors in early layers to semantic object parts in deeper layers. The learned features transfer well to other visual recognition tasks.

【Limitations and Insights】The architecture was limited by GPU memory (3GB per card at the time). AlexNet's success triggered an arms race in network depth and scale, leading to VGGNet, ResNet, and the billion-parameter models of today. It remains one of the most cited papers in computer science history.`,
  },
  {
    title: 'Generative Adversarial Networks',
    source: 'publication',
    discipline: 'artificial-intelligence',
    subDiscipline: 'deep-learning',
    tags: ['Deep Learning', 'Original Research'],
    authors: ['Ian J. Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu', 'David Warde-Farley', 'Sherjil Ozair', 'Aaron Courville', 'Yoshua Bengio'],
    year: 2014,
    url: 'https://papers.nips.cc/paper/2014/hash/5ca3e9b122f61f8f06494c97b1afccf3-Abstract.html',
    venue: 'NeurIPS',
    content: `【Core Contribution】This paper introduces Generative Adversarial Networks (GANs), a novel framework for training generative models via an adversarial game between two neural networks: a generator that creates synthetic data and a discriminator that distinguishes real from fake samples. This framework avoids the need for approximate inference or Markov chains during training.

【Method Highlights】The generator G(z) maps random noise z to data space, while the discriminator D(x) outputs a probability that x is real. Both are trained simultaneously: G tries to maximize the probability of fooling D, while D tries to correctly classify real vs. generated samples. At equilibrium, G captures the training data distribution.

【Key Conclusions】GANs generate sharp, realistic images of handwritten digits, faces, and CIFAR-10 objects that surpass competing generative models of the time. The adversarial framework is general and can be extended to conditional generation, image-to-image translation, and semi-supervised learning.

【Limitations and Insights】GAN training is notoriously unstable (mode collapse, vanishing gradients). Subsequent work introduced Wasserstein GANs, spectral normalization, and progressive growing to improve stability. GANs have since powered applications in image synthesis, style transfer, super-resolution, and drug molecule design.`,
  },
  {
    title: 'Denoising Diffusion Probabilistic Models',
    source: 'publication',
    discipline: 'artificial-intelligence',
    subDiscipline: 'deep-learning',
    tags: ['Deep Learning', 'Original Research'],
    authors: ['Jonathan Ho', 'Ajay Jain', 'Pieter Abbeel'],
    year: 2020,
    url: 'https://papers.nips.cc/paper/2020/hash/4c5bcfec8584af0d967f1ab10179ca4b-Abstract.html',
    venue: 'NeurIPS',
    content: `【Core Contribution】This paper demonstrates that diffusion models — a class of latent variable models inspired by nonequilibrium thermodynamics — can generate high-quality images that surpass GANs in fidelity and diversity. The key insight is to train a neural network to reverse a gradual noising process.

【Method Highlights】The forward process gradually adds Gaussian noise to data over T timesteps according to a fixed variance schedule. The reverse process learns a neural network to denoise at each step, effectively learning the score function of the data distribution. The authors use a U-Net architecture with attention mechanisms for the denoising network.

【Key Conclusions】On CIFAR-10, the diffusion model achieves an Inception Score of 9.46 and FID of 3.17 — state-of-the-art at the time without adversarial training. On LSUN bedrooms, the model generates coherent, high-resolution images with remarkable diversity.

【Limitations and Insights】Generation requires T sequential denoising steps (typically 1000), making inference slow compared to single-shot generators. This motivated subsequent research on diffusion distillation, latent diffusion models (Stable Diffusion), and flow matching. Diffusion models now dominate text-to-image generation, 3D synthesis, and video generation.`,
  },
  {
    title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
    source: 'publication',
    discipline: 'artificial-intelligence',
    subDiscipline: 'nlp',
    tags: ['Deep Learning', 'NLP', 'Original Research'],
    authors: ['Jason Wei', 'Xuezhi Wang', 'Dale Schuurmans', 'Maarten Bosma', 'Brian Ichter', 'Fei Xia', 'Ed Chi', 'Quoc Le', 'Denny Zhou'],
    year: 2022,
    url: 'https://papers.nips.cc/paper/2022/hash/9d5609613524ecf4f15af0f7b31abca4-Abstract-Conference.html',
    venue: 'NeurIPS',
    content: `【Core Contribution】This paper reveals that simply adding a few step-by-step reasoning examples ("chain-of-thought") to the prompt dramatically improves the arithmetic, commonsense, and symbolic reasoning abilities of large language models. This simple prompting technique unlocks emergent reasoning capabilities in models with ~100B+ parameters.

【Method Highlights】The authors evaluate PaLM (540B parameters) and GPT-3 (175B) on math word problems (GSM8K), strategy games (Game of 24), and symbolic manipulation tasks. Chain-of-thought prompting provides intermediate reasoning steps before the final answer, effectively decomposing multi-step problems into manageable sub-problems.

【Key Conclusions】Chain-of-thought prompting increases GSM8K accuracy from 17.9% to 58.1% for PaLM 540B — comparable to fine-tuned models. The technique is emergent: it only works effectively above a critical model scale threshold (~100B parameters).

【Limitations and Insights】Smaller models fail to benefit from chain-of-thought prompting. Subsequent work extended this to self-consistency (sampling multiple reasoning paths), tree-of-thought, and tool-augmented reasoning. This paper fundamentally changed how we interact with LLMs, establishing few-shot prompting with reasoning traces as a standard paradigm.`,
  },

  // ============================================
  // Materials Science (3 papers)
  // ============================================
  {
    title: 'The Rise of Graphene',
    source: 'publication',
    discipline: 'materials-science',
    subDiscipline: '2d-materials',
    tags: ['2D Material', 'Nanostructure', 'Original Research'],
    authors: ['A. K. Geim', 'K. S. Novoselov'],
    year: 2007,
    url: 'https://www.nature.com/articles/nmat1849',
    venue: 'Nature Materials',
    content: `【Core Contribution】This landmark review by the 2010 Nobel laureates in Physics introduces graphene — a single atomic layer of carbon arranged in a hexagonal lattice — and surveys its extraordinary electronic, mechanical, thermal, and optical properties. It established graphene as the prototypical two-dimensional material.

【Method Highlights】The authors describe the micromechanical cleavage ("Scotch tape") method for isolating monolayer graphene from graphite, and review the key experimental characterizations: quantum Hall effect measurements confirming massless Dirac fermion behavior, Raman spectroscopy for layer identification, and transport measurements revealing exceptionally high electron mobility (>200,000 cm^2/Vs at low temperature).

【Key Conclusions】Graphene exhibits a unique combination of properties: highest known thermal conductivity, exceptional mechanical strength (Young's modulus ~1 TPa), optical transparency (~97.7%), and ballistic electron transport over micrometer distances. These properties make it promising for transparent conductors, high-frequency transistors, and composite materials.

【Limitations and Insights】The lack of a bandgap limits digital electronics applications, motivating research on bilayer graphene with electric-field-induced gaps and graphene nanoribbons. This review catalyzed the entire field of 2D materials, leading to the discovery of transition metal dichalcogenides (TMDs), hexagonal boron nitride, and van der Waals heterostructures.`,
  },
  {
    title: 'Organometal Halide Perovskites as Visible-Light Sensitizers for Photovoltaic Cells',
    source: 'publication',
    discipline: 'materials-science',
    subDiscipline: 'nanomaterials',
    tags: ['Nanomaterial', 'Solar Energy', 'Original Research'],
    authors: ['Atsushi Kojima', 'Kenjiro Teshima', 'Yasuo Shirai', 'Tsutomu Miyasaka'],
    year: 2009,
    url: 'https://doi.org/10.1021/ja809598r',
    venue: 'Journal of the American Chemical Society',
    content: `【Core Contribution】This paper reports the first use of organometal halide perovskites (specifically methylammonium lead iodide, CH3NH3PbI3) as visible-light sensitizers in liquid-electrolyte dye-sensitized solar cells, achieving a power conversion efficiency of 3.8%. This modest beginning launched the perovskite solar cell revolution.

【Method Highlights】The authors deposit a thin perovskite layer onto mesoporous TiO2 by spin-coating a precursor solution containing methylammonium iodide and lead iodide. The perovskite acts as both light absorber and electron conductor. They characterize the optical absorption, photocurrent response, and photovoltaic performance under AM1.5 illumination.

【Key Conclusions】Perovskites exhibit strong optical absorption across the visible spectrum, long carrier diffusion lengths, and tunable bandgaps via halide composition mixing. These properties, combined with low-temperature solution processing, make them uniquely attractive for photovoltaic applications.

【Limitations and Insights】The initial efficiency was low and stability poor due to liquid electrolyte dissolution of the perovskite. Subsequent research replaced the liquid electrolyte with solid-state hole transport materials, pushing efficiencies above 25% within a decade. Challenges remain in long-term stability, lead toxicity, and large-area manufacturing.`,
  },
  {
    title: 'Three-Dimensional Optical Metamaterial with a Negative Refractive Index',
    source: 'publication',
    discipline: 'materials-science',
    subDiscipline: 'metamaterials',
    tags: ['Metamaterial', 'Nanostructure', 'Original Research'],
    authors: ['V. M. Shalaev', 'W. Cai', 'U. K. Chettiar', 'H.-K. Yuan', 'A. K. Sarychev', 'V. P. Drachev', 'A. V. Kildishev'],
    year: 2005,
    url: 'https://doi.org/10.1038/nature04747',
    venue: 'Nature',
    content: `【Core Contribution】This paper experimentally demonstrates the first three-dimensional optical metamaterial with a negative refractive index at telecommunications wavelengths (1.5 um). This achievement confirmed that Veselago's 1968 prediction of negative-index materials was realizable at optical frequencies, not just microwaves.

【Method Highlights】The metamaterial consists of alternating layers of silver and dielectric (MgF2) perforated with a periodic array of nanoscale holes. This "fishnet" structure supports both electric and magnetic resonances in the same frequency range, enabling simultaneously negative permittivity and permeability. The authors use prism refraction experiments and Snell's law to directly measure the negative refractive index.

【Key Conclusions】The measured refractive index is n = -0.3 at 1.5 um wavelength. This 3D isotropic structure overcomes the limitations of earlier planar metamaterials that only worked for one polarization or propagation direction. The double-negative behavior opens applications in superlenses, cloaking devices, and subwavelength imaging.

【Limitations and Insights】The structure is highly lossy due to silver absorption at optical frequencies, limiting practical applications. Subsequent research explored all-dielectric metamaterials, hyperbolic media, and epsilon-near-zero materials as lower-loss alternatives. This work remains a milestone in the quest for perfect lenses and optical invisibility cloaks.`,
  },

  // ============================================
  // Physics (2 papers)
  // ============================================
  {
    title: 'Observation of Gravitational Waves from a Binary Black Hole Merger',
    source: 'publication',
    discipline: 'physics',
    subDiscipline: 'theoretical-physics',
    tags: ['Original Research', 'Experiment Paper'],
    authors: ['B. P. Abbott et al. (LIGO Scientific Collaboration and Virgo Collaboration)'],
    year: 2016,
    url: 'https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.116.061102',
    venue: 'Physical Review Letters',
    content: `【Core Contribution】On September 14, 2015, LIGO detected gravitational waves for the first time in history — exactly 100 years after Einstein predicted their existence. The signal GW150914 originated from the inspiral and merger of two black holes (~36 and ~29 solar masses) located 1.3 billion light-years away, confirming a major prediction of general relativity and opening gravitational-wave astronomy.

【Method Highlights】The LIGO detectors (Hanford, WA and Livingston, LA) are Michelson interferometers with 4-km arm lengths that measure spacetime strain to better than 1 part in 10^21. Advanced LIGO's sensitivity improvements (factor of 10 over initial LIGO) enabled detection of this event with a matched-filter signal-to-noise ratio of 24. The signal matches the waveform predicted by numerical relativity simulations of binary black hole mergers.

【Key Conclusions】The observed waveform is consistent with general relativity predictions. The final black hole has a mass of ~62 solar masses, with ~3 solar masses radiated as gravitational wave energy — the most powerful astrophysical event ever observed. The detection directly confirms the existence of stellar-mass binary black hole systems and validates the black hole "no-hair" theorem.

【Limitations and Insights】This single detection already constrained alternative theories of gravity. Since then, LIGO/Virgo/KAGRA have detected nearly 100 gravitational wave events, including neutron star mergers (GW170817) that were observed across the electromagnetic spectrum, launching multi-messenger astronomy. This discovery was awarded the 2017 Nobel Prize in Physics.`,
  },
  {
    title: 'Possible High Tc Superconductivity in the Ba-La-Cu-O System',
    source: 'publication',
    discipline: 'physics',
    subDiscipline: 'condensed-matter',
    tags: ['Original Research', 'Experiment Paper'],
    authors: ['J. G. Bednorz', 'K. A. Muller'],
    year: 1986,
    url: 'https://doi.org/10.1002/zamm.19870670919',
    venue: 'Zeitschrift fur Physik B',
    content: `【Core Contribution】This paper reported the discovery of superconductivity at 30-35 K in a Ba-La-Cu-O ceramic compound — shattering the previous theoretical limit of ~30 K and ushering in the era of high-temperature superconductivity. Bednorz and Muller were awarded the 1987 Nobel Prize in Physics for this discovery, just one year after publication.

【Method Highlights】The authors synthesized ceramic samples of (Ba_xLa_(1-x))_2CuO_(4-y) using standard solid-state reaction methods and measured electrical resistivity and AC susceptibility. They identified a sharp drop in resistivity below 35 K and a corresponding diamagnetic signal confirming the superconducting transition.

【Key Conclusions】The critical temperature of ~35 K was unprecedented for non-oxide superconductors and challenged the BCS-Eliashberg theory which predicted a soft upper limit near 30 K. The layered perovskite structure with CuO2 planes was recognized as essential for high-Tc superconductivity.

【Limitations and Insights】The initial samples were inhomogeneous and the superconducting fraction was low. Within months, YBa2Cu3O7 (YBCO) was discovered with Tc above 90 K, followed by Bi- and Tl-based cuprates exceeding 130 K. Despite nearly four decades of research, the microscopic pairing mechanism in cuprates remains one of the most important open problems in condensed matter physics.`,
  },
]

async function main() {
  const client = await pool.connect()
  console.log(`Seeding ${PAPERS.length} papers into knowledge base...\n`)

  try {
    await client.query('BEGIN')

    let inserted = 0
    let skipped = 0

    for (const paper of PAPERS) {
      // Check if a paper with the same title already exists
      const { rows: existing } = await client.query(
        'SELECT id FROM "KnowledgeDocument" WHERE title = $1',
        [paper.title]
      )

      if (existing.length > 0) {
        console.log(`SKIP (exists): ${paper.title.substring(0, 60)}`)
        skipped++
        continue
      }

      const metadata = JSON.stringify({
        url: paper.url,
        authors: paper.authors,
        year: paper.year,
        venue: paper.venue,
        tags: paper.tags,
        subDiscipline: paper.subDiscipline,
        citationCount: paper.citationCount || null,
        importedFrom: 'seed',
      })

      await client.query(
        `INSERT INTO "KnowledgeDocument" (id, title, content, source, discipline, metadata, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [generateUUID(), paper.title, paper.content, paper.source, paper.discipline, metadata]
      )

      console.log(`INSERTED: ${paper.title.substring(0, 60)}`)
      inserted++
    }

    await client.query('COMMIT')

    console.log(`\n=== Done ===`)
    console.log(`Inserted: ${inserted}`)
    console.log(`Skipped: ${skipped}`)

    // Final count
    const { rows } = await client.query('SELECT COUNT(*) as total FROM "KnowledgeDocument"')
    console.log(`Total documents: ${rows[0].total}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(console.error)
