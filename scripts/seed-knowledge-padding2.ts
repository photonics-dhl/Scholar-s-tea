import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedDoc {
  title: string
  content: string
  source: string
  discipline: string
  viewCount: number
  metadata: Record<string, unknown>
}

const PADDING_DOCS: SeedDoc[] = [
  // Each subdiscipline gets +1 to reach 3 total

  // physics | atomic-molecular
  {
    title: 'Laser Cooling and Trapping of Neutral Atoms',
    discipline: 'physics',
    source: 'paper',
    viewCount: 108,
    metadata: {
      subDiscipline: 'atomic-molecular',
      tags: ['Laser Cooling', 'Magneto-Optical Trap', 'Bose-Einstein Condensate', 'Doppler Cooling'],
      authors: ['Phillips, W.D.', 'Chu, S.'],
      year: 2024,
      abstract: 'A review of laser cooling techniques for neutral atoms, covering Doppler cooling, sub-Doppler methods, and evaporative cooling to quantum degeneracy.',
    },
    content: `## Laser Cooling Principles

Resonant laser light exerts radiation pressure on atoms, enabling cooling to microkelvin temperatures where quantum effects dominate.

## Doppler Cooling

- Red-detuned cooling light
- Doppler limit: k_B T = hbar gamma / 2
- Magneto-optical trap (MOT) for 3D confinement

## Sub-Doppler Cooling

- Sisyphus cooling in polarization gradients
- Raman and resolved-sideband cooling
- Velocity-selective coherent population trapping

## Atom Traps

- Magnetic traps for spin-polarized atoms
- Optical dipole traps with far-off-resonant lasers
- Atom chips with integrated microtraps

## Applications

- Atomic clocks and precision spectroscopy
- Quantum degenerate gases
- Atom interferometry for inertial sensing`,
  },

  // physics | computational-physics
  {
    title: 'Density Matrix Renormalization Group for 1D Quantum Systems',
    discipline: 'physics',
    source: 'paper',
    viewCount: 95,
    metadata: {
      subDiscipline: 'computational-physics',
      tags: ['DMRG', 'Matrix Product State', '1D System', 'Strong Correlation'],
      authors: ['White, S.R.', 'Schollwock, U.'],
      year: 2024,
      abstract: 'A review of the density matrix renormalization group method and its formulation using matrix product states for one-dimensional quantum many-body systems.',
    },
    content: `## DMRG Foundation

DMRG variationally optimizes matrix product states to accurately capture ground-state properties of one-dimensional quantum systems.

## Matrix Product States

- Tensor network representation of quantum states
- Entanglement area law and efficient compression
- Canonical forms and gauge freedom

## Algorithms

- Single-site and two-site DMRG updates
- Time-evolving block decimation (TEBD)
- Dynamical correlation functions via correction vectors

## Extensions

- Finite temperature and real-time evolution
- Multi-component and higher-symmetry systems
- Excited state targeting

## Applications

- Spin chains and Hubbard models
- Quantum chemistry quasi-1D molecules
- Topological phases and anyonic chains`,
  },

  // optics | physical-optics
  {
    title: 'Orbital Angular Momentum of Light and Optical Vortices',
    discipline: 'optics',
    source: 'paper',
    viewCount: 127,
    metadata: {
      subDiscipline: 'physical-optics',
      tags: ['Orbital Angular Momentum', 'Optical Vortex', 'Laguerre-Gaussian', 'Structured Light'],
      authors: ['Allen, L.', 'Padgett, M.J.'],
      year: 2024,
      abstract: 'A review of light beams carrying orbital angular momentum, including Laguerre-Gaussian modes, optical spanners, and applications in optical communication.',
    },
    content: `## Orbital Angular Momentum

Beyond spin angular momentum (polarization), light can carry orbital angular momentum associated with helical phase fronts.

## Laguerre-Gaussian Modes

- Azimuthal phase dependence exp(ilphi)
- Vortex core with zero intensity
- Orthogonal modes for mode-division multiplexing

## Generation Methods

- Spiral phase plates and holograms
- Q-plates with liquid crystals
- Metasurface vortex generators

## Detection and Sorting

- Interferometric mode decomposition
- Log-polar coordinate transformation
- Neural network classification

## Applications

- Free-space optical communication
- Optical manipulation and microrheology
- Quantum information encoding
- Astrophysical coronagraphy`,
  },

  // optics | geometric-optics
  {
    title: 'Computational Imaging with Coded Apertures and Phase Retrieval',
    discipline: 'optics',
    source: 'paper',
    viewCount: 115,
    metadata: {
      subDiscipline: 'geometric-optics',
      tags: ['Computational Imaging', 'Coded Aperture', 'Phase Retrieval', 'Lensless Imaging'],
      authors: ['Barbastathis, G.', 'Tian, L.'],
      year: 2024,
      abstract: 'A review of computational imaging techniques using coded apertures and iterative phase retrieval algorithms for high-resolution and lensless imaging.',
    },
    content: `## Computational Imaging Paradigm

Optical encoding combined with computational decoding overcomes physical lens limitations for super-resolution and extended depth of field.

## Coded Aperture Imaging

- Random and optimized binary masks
- Compressive sensing for sparse scenes
- X-ray and gamma-ray astronomy applications

## Phase Retrieval

- Gerchberg-Saxton and Fienup algorithms
- Ptychography with scanning probes
- PhaseLift and convex relaxation methods

## Lensless Imaging

- DiffuserCam and random scattering media
- Autocorrelation-based reconstruction
- Deep learning for lensless image recovery

## Applications

- Microscopy with extended depth of field
- Holographic displays
- Single-pixel imaging
- Through-wall and non-line-of-sight imaging`,
  },

  // optics | nonlinear-optics
  {
    title: 'Quantum Cascade Lasers for Mid-Infrared Spectroscopy',
    discipline: 'optics',
    source: 'paper',
    viewCount: 132,
    metadata: {
      subDiscipline: 'nonlinear-optics',
      tags: ['Quantum Cascade Laser', 'Mid-Infrared', 'Spectroscopy', 'Interband Cascade'],
      authors: ['Capasso, F.', 'Faist, J.'],
      year: 2024,
      abstract: 'A review of quantum cascade laser technology for mid-infrared sources, covering band structure engineering and applications in trace gas sensing.',
    },
    content: `## Quantum Cascade Laser Physics

Unipolar intersubband transitions in semiconductor quantum wells enable efficient mid-infrared laser emission at engineered wavelengths.

## Band Structure Engineering

- Conduction band staircase design
- Strain-compensated quantum wells
- Dual-upper-state and bound-to-continuum designs

## Performance Characteristics

- Room-temperature continuous-wave operation
- Watt-level output power
- Tunability via external cavities

## Spectroscopic Applications

- Trace gas detection with ppm sensitivity
- Breath analysis for medical diagnostics
- Environmental monitoring of greenhouse gases

## Emerging Directions

- THz quantum cascade lasers
- Frequency comb operation
- Integrated photonic circuits with QCLs`,
  },

  // photonics | optical-computing
  {
    title: ' reservoir Computing with Delay Dynamical Systems',
    discipline: 'photonics',
    source: 'paper',
    viewCount: 89,
    metadata: {
      subDiscipline: 'optical-computing',
      tags: ['Reservoir Computing', 'Delay Dynamics', 'Photonic Neuromorphic', 'Mackey-Glass'],
      authors: ['Appeltant, L.', 'Soriano, M.C.'],
      year: 2024,
      abstract: 'A review of photonic reservoir computing using delay dynamical systems, enabling hardware-efficient neuromorphic computation with a single nonlinear node.',
    },
    content: `## Reservoir Computing Concept

A fixed random dynamical reservoir transforms input signals into high-dimensional states, with only a linear readout trained for specific tasks.

## Delay-Based Reservoirs

- Single nonlinear node with delayed feedback
- Virtual nodes created by time-multiplexing
- Mackey-Glass and Ikeda delay dynamics

## Photonic Implementations

- Semiconductor lasers with optical feedback
- Electro-optic modulator loops
- All-optical fiber-based reservoirs

## Performance Metrics

- Memory capacity and nonlinear transformation
- Benchmark tasks: NARMA and channel equalization
- Speed and energy efficiency advantages

## Comparison with Neural Networks

- Training-free reservoir vs. backpropagation
- Physical reservoir computing with edge-of-chaos dynamics
- Applications in time-series prediction`,
  },

  // photonics | fiber-photonics
  {
    title: 'Multicore Optical Fibers for Spatial Division Multiplexing',
    discipline: 'photonics',
    source: 'paper',
    viewCount: 118,
    metadata: {
      subDiscipline: 'fiber-photonics',
      tags: ['Multicore Fiber', 'Spatial Division Multiplexing', 'SDM', 'Coupled-Core'],
      authors: ['Richardson, D.J.', 'Li, G.'],
      year: 2024,
      abstract: 'A review of multicore optical fibers enabling spatial division multiplexing for capacity scaling beyond single-mode fiber limits.',
    },
    content: `## Spatial Division Multiplexing

Multiple spatial channels in a single fiber cladding multiply transmission capacity without increasing nonlinear interference.

## Multicore Fiber Designs

- Uncoupled and coupled-core configurations
- Few-mode multicore fibers
- trench-assisted and hole-assisted structures

## Crosstalk and MIMO Processing

- Inter-core crosstalk mechanisms
- Multi-input multi-output digital signal processing
- Modal dispersion compensation

## Amplification and Components

- Multicore EDFA and Raman amplifiers
- Fan-in/fan-out couplers
- Multicore optical switches

## System Demonstrations

- Petabit/s transmission experiments
- Submarine cable feasibility studies
- Cost modeling for SDM deployment`,
  },

  // photonics | nano-optics
  {
    title: 'Dielectric Mie Resonance Metasurfaces for Holography',
    discipline: 'photonics',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'nano-optics',
      tags: ['Mie Resonance', 'Dielectric Metasurface', 'Holography', 'High-NA'],
      authors: ['Kuznetsov, A.I.', 'Kivshar, Y.'],
      year: 2024,
      abstract: 'A review of high-index dielectric metasurfaces supporting Mie resonances for efficient holographic displays and polarization control devices.',
    },
    content: `## Dielectric Nanostructures

High-refractive-index nanoparticles support electric and magnetic Mie resonances with low absorption, enabling efficient wavefront shaping.

## Mie Resonance Engineering

- Geometric control of resonance wavelength
- Multipole decomposition and interference
- Kerker conditions for directional scattering

## Holographic Metasurfaces

- Computer-generated hologram encoding
- Phase-only and amplitude-phase modulation
- Full-color and dynamic holography

## Fabrication Techniques

- Electron beam lithography
- Nanoimprint and self-assembly
- CMOS-compatible deposition and etching

## Applications

- Compact augmented reality displays
- Polarization cameras and sensors
- Optical encryption and anti-counterfeiting
- Beam steering for LiDAR`,
  },

  // materials-science | nanomaterials
  {
    title: 'Two-Dimensional Transition Metal Dichalcogenides for Electronics',
    discipline: 'materials-science',
    source: 'paper',
    viewCount: 156,
    metadata: {
      subDiscipline: 'nanomaterials',
      tags: ['TMDC', 'MoS2', '2D Material', 'Field-Effect Transistor'],
      authors: ['Javey, A.', 'Kis, A.'],
      year: 2024,
      abstract: 'A review of two-dimensional transition metal dichalcogenides including MoS2 and WSe2 for next-generation field-effect transistors and optoelectronics.',
    },
    content: `## TMDC Properties

Monolayer TMDCs are direct-bandgap semiconductors with strong spin-orbit coupling and valley-selective optical selection rules.

## Electronic Devices

- Monolayer MoS2 field-effect transistors
- Contact engineering for low resistance
- Dielectric integration and mobility enhancement

## Optoelectronic Applications

- Photodetectors and photovoltaics
- Light-emitting diodes and lasers
- Valleytronic devices

## Growth Methods

- Chemical vapor deposition on insulating substrates
- Metal-organic CVD for wafer-scale films
- Exfoliation and layer transfer

## Heterostructure Engineering

- Vertical van der Waals heterostacks
- Tunneling transistors and memristors
- Twistronics and moire superlattices`,
  },

  // materials-science | semiconductors
  {
    title: 'Quantum Dot Single-Photon Emitters for Quantum Communication',
    discipline: 'materials-science',
    source: 'paper',
    viewCount: 167,
    metadata: {
      subDiscipline: 'semiconductors',
      tags: ['Quantum Dot', 'Single Photon', 'Quantum Communication', 'InAs'],
      authors: ['Shields, A.J.', 'Santori, C.'],
      year: 2024,
      abstract: 'A review of semiconductor quantum dot single-photon sources, covering Purcell enhancement, indistinguishability, and quantum key distribution applications.',
    },
    content: `## Quantum Dot Photophysics

Self-assembled InAs quantum dots in GaAs emit single photons with excellent quantum properties at cryogenic temperatures.

## Single-Photon Quality

- Antibunching and g^(2)(0) measurement
- Indistinguishability via Hong-Ou-Mandel
- Purcell enhancement in micropillar cavities

## Wavelength Control

- Strain tuning and Stark shift
- Quantum dot growth optimization
- Frequency conversion for telecom compatibility

## Device Integration

- Waveguide-coupled quantum dots
- On-chip beam splitters and detectors
- Entangled photon pair generation

## Quantum Communication

- BB84 quantum key distribution
- Quantum repeater nodes
- Satellite-to-ground quantum links`,
  },

  // materials-science | optoelectronic-materials
  {
    title: 'Organic Light-Emitting Diodes: Materials and Device Physics',
    discipline: 'materials-science',
    source: 'paper',
    viewCount: 145,
    metadata: {
      subDiscipline: 'optoelectronic-materials',
      tags: ['OLED', 'Organic Semiconductor', 'Phosphorescent', 'TADF'],
      authors: ['Forrest, S.R.', 'Adachi, C.'],
      year: 2024,
      abstract: 'A review of organic light-emitting diode technology, covering fluorescent, phosphorescent, and thermally activated delayed fluorescence emitters.',
    },
    content: `## OLED Operating Principles

Electrons and holes recombine in organic emissive layers, producing light with high efficiency and tunable color.

## Emitter Materials

- Fluorescent emitters (25% internal quantum efficiency)
- Phosphorescent iridium complexes (100% IQE)
- Thermally activated delayed fluorescence (TADF)

## Device Architecture

- Bottom-emission vs. top-emission structures
- Tandem OLEDs with charge generation layers
- Microcavity effects for color purity

## Stability Challenges

- Intrinsic degradation mechanisms
- Dark spot formation and encapsulation
- Blue emitter lifetime limitations

## Display Applications

- Active-matrix OLED displays
- Foldable and stretchable OLED panels
- Near-eye displays for VR/AR`,
  },

  // chemistry | computational-chemistry
  {
    title: 'Machine Learning Potentials for Molecular Dynamics Simulations',
    discipline: 'chemistry',
    source: 'paper',
    viewCount: 178,
    metadata: {
      subDiscipline: 'computational-chemistry',
      tags: ['Machine Learning Potential', 'Neural Network Potential', 'Molecular Dynamics', 'QM/MM'],
      authors: ['Behler, J.', 'Noe, F.'],
      year: 2024,
      abstract: 'A review of machine learning potentials that combine quantum mechanical accuracy with molecular dynamics computational efficiency for large systems.',
    },
    content: `## Machine Learning Potentials

Neural networks trained on quantum mechanical data provide accurate potential energy surfaces at a fraction of DFT computational cost.

## Descriptor Design

- Symmetry functions and atom-centered descriptors
- Smooth overlap of atomic positions (SOAP)
- Graph neural network representations

## Network Architectures

- Behler-Parrinello neural networks
- SchNet and DimeNet message passing
- Equivariant neural networks (NequIP, Allegro)

## Training Data

- Active learning for data efficiency
- Delta learning on DFT errors
- Transfer learning across chemical space

## Applications

- Reactive molecular dynamics
- Materials property prediction
- Protein folding and drug binding
- Catalytic reaction pathways`,
  },

  // biology | biophysics
  {
    title: 'Single-Molecule Force Spectroscopy of Protein Folding',
    discipline: 'biology',
    source: 'paper',
    viewCount: 123,
    metadata: {
      subDiscipline: 'biophysics',
      tags: ['Single Molecule', 'Force Spectroscopy', 'Protein Folding', 'Optical Tweezers'],
      authors: ['Bustamante, C.', 'Tinoco, I.'],
      year: 2024,
      abstract: 'A review of single-molecule force spectroscopy techniques using optical tweezers and AFM to study protein folding dynamics and mechanical stability.',
    },
    content: `## Force Spectroscopy Methods

Optical tweezers and atomic force microscopy apply piconewton forces to individual biomolecules, revealing their mechanical properties.

## Optical Tweezers

- Dual-beam trap with bead handles
- Constant-force and force-ramp modes
- High-resolution position detection

## AFM Force Spectroscopy

- Cantilever-based force measurement
- Force-clamp and dynamic force spectroscopy
- Refolding after mechanical unfolding

## Folding Dynamics

- Two-state and intermediate folding pathways
- Energy landscape reconstruction
- Transition path times and barrier heights

## Applications

- Mechanical stability of proteins
- Ribosome-nascent chain interactions
- Chaperone-assisted folding
- Protein aggregation and misfolding`,
  },

  // biology | synthetic-biology
  {
    title: 'Engineering Genetic Logic Gates and Circuits in Living Cells',
    discipline: 'biology',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'synthetic-biology',
      tags: ['Genetic Logic Gate', 'Synthetic Circuit', 'Gene Regulation', 'Biocomputation'],
      authors: ['Endy, D.', 'Voigt, C.A.'],
      year: 2024,
      abstract: 'A review of synthetic genetic circuits implementing Boolean logic gates, feedback loops, and oscillators in bacterial and mammalian cells.',
    },
    content: `## Genetic Circuit Design

Synthetic biology engineers regulatory networks that process cellular signals and execute programmed behaviors.

## Logic Gates

- NOT, AND, OR gates with transcription factors
- NOR and NAND universal gates
- Layered combinatorial logic

## Dynamic Circuits

- Repressilator three-node oscillator
- Toggle switch bistability
- Band-pass and pulse generators

## Host Context Effects

- Chassis dependency and genetic background
- Metabolic burden and growth coupling
- Context-aware insulation strategies

## Applications

- Biosensors for environmental and medical diagnostics
- Cell-based therapeutics with programmable responses
- Metabolic pathway optimization
- Living materials and biofabrication`,
  },

  // biology | neuroscience
  {
    title: 'Two-Photon Calcium Imaging of Large-Scale Neural Ensembles',
    discipline: 'biology',
    source: 'paper',
    viewCount: 145,
    metadata: {
      subDiscipline: 'neuroscience',
      tags: ['Two-Photon Imaging', 'Calcium Imaging', 'Neural Ensemble', 'Population Coding'],
      authors: ['Svoboda, K.', 'Scanziani, M.'],
      year: 2024,
      abstract: 'A review of two-photon calcium imaging techniques for recording activity from thousands of neurons in vivo during behavior and sensory processing.',
    },
    content: `## Two-Photon Microscopy

Nonlinear excitation enables deep-tissue imaging with optical sectioning, recording neural activity via genetically encoded calcium indicators.

## Calcium Indicators

- Synthetic dyes: OGB-1 and Cal-520
- GCaMP variants with improved kinetics
- Red-shifted indicators for dual-color imaging

## Large-Scale Recording

- Multi-plane and random-access microscopy
- Mesoscopic imaging with large fields of view
- Head-mounted miniaturized microscopes

## Data Analysis

- Source extraction and ROI segmentation
- Spike inference from calcium transients
- Dimensionality reduction and decoding

## Behavioral Correlates

- Place cells and grid cells in navigation
- Sensory coding in visual and auditory cortex
- Motor planning and execution dynamics`,
  },

  // mathematics | optimization
  {
    title: 'Stochastic Gradient Descent and Variance Reduction Methods',
    discipline: 'mathematics',
    source: 'paper',
    viewCount: 156,
    metadata: {
      subDiscipline: 'optimization',
      tags: ['Stochastic Gradient Descent', 'Variance Reduction', 'SVRG', 'Machine Learning'],
      authors: ['Bottou, L.', 'Johnson, R.'],
      year: 2024,
      abstract: 'A review of stochastic gradient descent and variance-reduced optimization methods for large-scale machine learning problems.',
    },
    content: `## Stochastic Optimization

SGD and its variants are the workhorse optimizers for training large neural networks on massive datasets.

## Convergence Analysis

- Convex case: O(1/sqrt(T)) and O(1/T) rates
- Non-convex: convergence to stationary points
- Learning rate schedules and decay strategies

## Variance Reduction

- SVRG and SAGA with periodic full gradients
- SARAH and recursive gradient estimators
- Katyusha acceleration with proximal updates

## Adaptive Methods

- AdaGrad and per-parameter learning rates
- RMSprop and exponential moving averages
- Adam and bias correction

## Distributed Training

- Synchronous and asynchronous SGD
- Local SGD and communication efficiency
- Federated averaging for decentralized data`,
  },

  // engineering | optical-engineering
  {
    title: 'Integrated Photonic Spectrometers on Silicon Nitride Platform',
    discipline: 'engineering',
    source: 'paper',
    viewCount: 112,
    metadata: {
      subDiscipline: 'optical-engineering',
      tags: ['Photonic Spectrometer', 'Silicon Nitride', 'Integrated Optics', 'Echelle'],
      authors: ['Bogaerts, W.', 'Morton, P.A.'],
      year: 2024,
      abstract: 'A review of compact integrated photonic spectrometers on silicon nitride platforms, covering arrayed waveguide gratings and echelle grating designs.',
    },
    content: `## On-Chip Spectroscopy

Integrated photonic spectrometers replace bulky benchtop instruments for portable and deployable sensing applications.

## AWG Designs

- Arrayed waveguide grating demultiplexers
- Free spectral range and channel spacing
- Crosstalk and insertion loss optimization

## Echelle Gratings

- Rowland-circle and planar configurations
- High diffraction orders for high resolution
- Two-dimensional detector array readout

## Fourier Transform Spectrometers

- Stationary-wave integrated FT spectrometers
- Mach-Zehnder interferometer arrays
- Reconstruction algorithms and calibration

## Applications

- On-chip Raman and absorption spectroscopy
- Environmental and agricultural monitoring
- Point-of-care medical diagnostics
- Industrial process control`,
  },

  // engineering | energy-engineering
  {
    title: 'Solid-State Batteries with Ceramic and Polymer Electrolytes',
    discipline: 'engineering',
    source: 'paper',
    viewCount: 167,
    metadata: {
      subDiscipline: 'energy-engineering',
      tags: ['Solid-State Battery', 'Ceramic Electrolyte', 'Polymer Electrolyte', 'Li Metal'],
      authors: ['Goodenough, J.B.', 'Janek, J.'],
      year: 2024,
      abstract: 'A review of solid-state battery technology using ceramic oxide and sulfide electrolytes and polymer composite electrolytes for next-generation energy storage.',
    },
    content: `## Solid-State Battery Motivation

Replacing flammable liquid electrolytes with solid conductors enables lithium metal anodes and improves safety.

## Ceramic Electrolytes

- Garnet-type LLZO with high ionic conductivity
- Argyrodite and thio-LISICON sulfides
- Interface stability with electrodes

## Polymer Electrolytes

- PEO-based complexes with lithium salts
- Single-ion conducting polymers
- Composite polymer-ceramic hybrids

## Cell Architecture

- Thin-film and bulk-type designs
- Pressure requirements for cycling
- Stack design and scaling challenges

## Manufacturing and Outlook

- Co-sintering and thin-film deposition
- Cost modeling vs. conventional Li-ion
- Automotive qualification timelines`,
  },

  // computer-science | networks
  {
    title: 'Data Center Network Topologies and Load Balancing',
    discipline: 'computer-science',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'networks',
      tags: ['Data Center', 'Network Topology', 'Load Balancing', 'Fat Tree'],
      authors: ['Al-Fares, M.', 'Greenberg, A.'],
      year: 2024,
      abstract: 'A review of data center network architectures including fat-tree, Clos, and direct-connect topologies with congestion-aware load balancing.',
    },
    content: `## Data Center Network Requirements

Scale, bandwidth, and fault tolerance demands drive specialized network architectures for modern cloud computing.

## Topologies

- Fat-tree and three-tier Clos networks
- Jellyfish random graphs vs. structured designs
- Direct-connect topologies for AI clusters

## Routing and Load Balancing

- ECMP and packet spraying
- CONGA and HULA congestion-aware routing
- In-network telemetry for real-time adaptation

## Transport Protocols

- DCTCP and ECN for low latency
- PIAS and pFabric flow prioritization
- RDMA over converged Ethernet (RoCE)

## Emerging Trends

- Optical circuit switching for elephant flows
- In-network computation and aggregation
- Disaggregated memory and CXL fabrics`,
  },

  // computer-science | algorithms
  {
    title: 'Approximation Schemes for Geometric Optimization Problems',
    discipline: 'computer-science',
    source: 'paper',
    viewCount: 76,
    metadata: {
      subDiscipline: 'algorithms',
      tags: ['Approximation Scheme', 'Geometric Algorithm', 'PTAS', 'Computational Geometry'],
      authors: ['Arora, S.', 'Mitchell, J.S.B.'],
      year: 2024,
      abstract: 'A review of polynomial-time approximation schemes for NP-hard geometric problems including Euclidean TSP, facility location, and clustering.',
    },
    content: `## Geometric PTAS

Structural properties of Euclidean instances enable approximation schemes with arbitrary precision in polynomial time.

## Arora's TSP PTAS

- Randomized dissection and portal-respecting tours
- Dynamic programming on quadtree structures
- (1+epsilon)-approximation in n^{O(1/epsilon)} time

## Facility Location and Clustering

- Local search algorithms with constant approximations
- Coresets for scalable geometric optimization
- k-means++ and Lloyd's algorithm analysis

## Streaming and Dynamic Settings

- Geometric streaming with sublinear space
- Dynamic maintenance of approximate solutions
- MapReduce and parallel algorithms

## Applications

- Vehicle routing and logistics
- Sensor placement and coverage
- Image segmentation and clustering
- Geographic information systems`,
  },

  // medicine | drug-discovery
  {
    title: 'Structure-Based Drug Design with Cryo-EM and X-Ray Data',
    discipline: 'medicine',
    source: 'paper',
    viewCount: 145,
    metadata: {
      subDiscipline: 'drug-discovery',
      tags: ['Structure-Based Design', 'Cryo-EM', 'Molecular Docking', 'Drug Design'],
      authors: ['Blundell, T.L.', 'Abraham, N.'],
      year: 2024,
      abstract: 'A review of structure-based drug design leveraging cryo-EM and X-ray crystallography for target structure determination and ligand optimization.',
    },
    content: `## Structural Biology for Drug Design

High-resolution target structures enable rational design and optimization of therapeutic ligands.

## Cryo-EM Advances

- Near-atomic resolution for membrane proteins
- GPCRs and ion channels in lipid nanodiscs
- Time-resolved cryo-EM for conformational dynamics

## Docking and Scoring

- Rigid and flexible receptor docking
- MM-GBSA and free energy perturbation scoring
- Machine learning scoring functions

## Fragment-Based Design

- Fragment screening by crystallography
- Growing and linking strategies
- Hit-to-lead optimization cycles

## Emerging Targets

- Intrinsically disordered proteins
- Protein-protein interaction interfaces
- RNA structures as drug targets`,
  },

  // economics | financial-engineering
  {
    title: 'Deep Hedging and Reinforcement Learning in Derivatives Pricing',
    discipline: 'economics',
    source: 'paper',
    viewCount: 118,
    metadata: {
      subDiscipline: 'financial-engineering',
      tags: ['Deep Hedging', 'Reinforcement Learning', 'Derivatives', 'Risk Management'],
      authors: ['Buehler, H.', 'Cole, S.'],
      year: 2024,
      abstract: 'A review of deep hedging approaches using reinforcement learning to optimize derivative hedging strategies under market frictions and model risk.',
    },
    content: `## Classical Hedging Theory

Black-Scholes assumes continuous trading and no frictions, leading to perfect replication that fails in practice.

## Deep Hedging Framework

- Neural network policy for hedging ratios
- Risk measure minimization: CVaR and entropy
- Accounting for transaction costs and market impact

## Reinforcement Learning Approaches

- Q-learning for discrete action spaces
- Policy gradient methods for continuous hedging
- Model-free learning from market data

## Model Risk and Uncertainty

- Worst-case hedging under model ambiguity
- Adversarial training for robustness
- Bayesian model averaging

## Practical Implementation

- Real-time hedging for exotic options
- Portfolio-level risk management
- Integration with existing trading systems`,
  },

  // interdisciplinary | computational-physics
  {
    title: 'Variational Quantum Algorithms for Molecular Electronic Structure',
    discipline: 'interdisciplinary',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'computational-physics',
      tags: ['Variational Quantum Algorithm', 'VQE', 'Quantum Chemistry', 'NISQ'],
      authors: ['Cao, Y.', 'Aspuru-Guzik, A.'],
      year: 2024,
      abstract: 'A review of variational quantum eigensolver algorithms for molecular electronic structure calculations on near-term quantum hardware.',
    },
    content: `## NISQ Quantum Chemistry

Variational quantum algorithms use parameterized circuits and classical optimizers to find molecular ground states.

## Ansatz Design

- UCCSD and coupled-cluster inspired circuits
- Hardware-efficient and problem-inspired ansatze
- Adaptive schemes: ADAPT-VQE and qubit-ADAPT

## Measurement Optimization

- Qubit tapering and Z2 symmetry reduction
- Entanglement forging and circuit knitting
- Shadow tomography for energy estimation

## Classical Optimizers

- Gradient-free: SPSA and COBYLA
- Analytic gradients via parameter-shift rule
- Barren plateau mitigation strategies

## Benchmarking and Outlook

- Classical-quantum hybrid approaches
- Active space selection for large molecules
- Error mitigation and extrapolation techniques`,
  },

  // interdisciplinary | bioinformatics
  {
    title: 'Deep Learning for Protein Structure Prediction and Design',
    discipline: 'interdisciplinary',
    source: 'paper',
    viewCount: 189,
    metadata: {
      subDiscipline: 'bioinformatics',
      tags: ['Protein Structure Prediction', 'AlphaFold', 'Deep Learning', 'Protein Design'],
      authors: ['Jumper, J.', 'Baker, D.'],
      year: 2024,
      abstract: 'A review of deep learning methods for protein structure prediction including AlphaFold and RoseTTAFold, and their extension to protein design.',
    },
    content: `## Protein Structure Prediction Revolution

Deep learning has transformed protein structure prediction, achieving near-experimental accuracy for single chains and complexes.

## AlphaFold Architecture

- Evoformer for MSA and pair representation
- Structure module with invariant point attention
- Confidence metrics: pLDDT and PAE

## Multimer and Complex Prediction

- Protein-protein docking with AlphaFold-Multimer
- RoseTTAFold and ColabFold implementations
- Integration with cryo-EM density maps

## Protein Design

- Inverse folding with ProteinMPNN
- Hallucination and inpainting for novel folds
- RFdiffusion for backbone generation

## Functional Prediction

- Ligand binding site identification
- Enzyme active site and mechanism
- Protein engineering for improved properties`,
  },

  // social-sciences | psychology
  {
    title: 'Social Cognitive Neuroscience of Empathy and Theory of Mind',
    discipline: 'social-sciences',
    source: 'paper',
    viewCount: 98,
    metadata: {
      subDiscipline: 'psychology',
      tags: ['Empathy', 'Theory of Mind', 'Social Neuroscience', 'fMRI'],
      authors: ['Frith, C.D.', 'Singer, T.'],
      year: 2024,
      abstract: 'A review of neural mechanisms underlying empathy and theory of mind, examining shared affective circuits and mentalizing network interactions.',
    },
    content: `## Empathy and Mentalizing

Understanding others' emotions and thoughts relies on dissociable but interacting neural systems.

## Affective Empathy

- Shared neural representations for pain and emotion
- Anterior insula and anterior cingulate cortex
- Emotional contagion and self-other distinction

## Cognitive Perspective Taking

- Temporoparietal junction and medial prefrontal cortex
- False belief tasks and mental state attribution
- Individual differences in trait empathy

## Social Context Modulation

- Ingroup bias in empathic responses
- Dehumanization and reduced neural resonance
- Prosocial behavior and compassion training

## Clinical Relevance

- Autism spectrum and theory of mind deficits
- Psychopathy and empathic dysfunction
- Interventions for social cognition impairments`,
  },

  // social-sciences | sociology
  {
    title: 'Computational Social Science and Digital Trace Data',
    discipline: 'social-sciences',
    source: 'paper',
    viewCount: 87,
    metadata: {
      subDiscipline: 'sociology',
      tags: ['Computational Social Science', 'Digital Trace', 'Big Data', 'Social Media'],
      authors: ['Lazer, D.M.', 'Watts, D.J.'],
      year: 2024,
      abstract: 'A review of computational social science methods using digital trace data from online platforms to study social behavior at unprecedented scales.',
    },
    content: `## Digital Trace Data

Online interactions, mobility patterns, and consumption behaviors generate massive observational datasets for social science research.

## Data Sources and Ethics

- Social media APIs and web scraping
- Mobile phone and GPS mobility data
- Privacy, consent, and representativeness concerns

## Methodological Approaches

- Natural experiments from platform changes
- Network analysis of online communities
- Text analysis of public discourse

## Substantive Findings

- Emotion contagion in social networks
- Political polarization and echo chambers
- Predictability of human mobility patterns

## Challenges

- Algorithmic curation and visibility bias
- Replication and data access restrictions
- Bridging computational and theory-driven traditions`,
  },

  // earth-sciences | environmental
  {
    title: 'Life Cycle Assessment of Renewable Energy Technologies',
    discipline: 'earth-sciences',
    source: 'paper',
    viewCount: 112,
    metadata: {
      subDiscipline: 'environmental',
      tags: ['Life Cycle Assessment', 'LCA', 'Renewable Energy', 'Carbon Footprint'],
      authors: ['Hertwich, E.G.', 'Gibon, T.'],
      year: 2024,
      abstract: 'A review of life cycle assessment methodologies applied to solar, wind, and battery technologies for quantifying environmental impacts.',
    },
    content: `## LCA Framework

Life cycle assessment systematically evaluates environmental impacts across raw material extraction, manufacturing, use, and end-of-life phases.

## Renewable Energy Systems

- PV panels: silicon purification energy payback
- Wind turbines: rare earth magnet dependencies
- Battery storage: lithium mining and recycling

## Impact Categories

- Global warming potential and carbon intensity
- Water use and land use changes
- Ecotoxicity and human health impacts

## Methodological Choices

- Attributional vs. consequential LCA
- Allocation methods for multi-output processes
- Uncertainty and sensitivity analysis

## Policy Relevance

- Grid-scale energy system optimization
- Circular economy and material criticality
- Comparative assessment of decarbonization pathways`,
  },

  // earth-sciences | oceanography
  {
    title: 'Argo Float Network and Global Ocean State Estimation',
    discipline: 'earth-sciences',
    source: 'paper',
    viewCount: 94,
    metadata: {
      subDiscipline: 'oceanography',
      tags: ['Argo', 'Ocean Observation', 'State Estimation', 'Data Assimilation'],
      authors: ['Roemmich, D.', 'Wunsch, C.'],
      year: 2024,
      abstract: 'A review of the Argo float program and ocean state estimation techniques combining in-situ profiles with satellite altimetry and models.',
    },
    content: `## Argo Program

A global array of autonomous profiling floats measures temperature, salinity, and biogeochemical parameters throughout the upper 2000m of the ocean.

## Float Technology

- Drifting at parking depth, profiling every 10 days
- CTD sensors and oxygen optodes
- Deep Argo extension to 6000m

## Data Assimilation

- Merging Argo profiles with satellite altimetry
- 4D variational and ensemble Kalman filter methods
- Ocean reanalysis products: ECCO and GLORYS

## Scientific Discoveries

- Global ocean heat content trends
- Salinity changes and water mass transformation
- Meridional overturning circulation monitoring

## Biogeochemical Argo

- Nitrate, chlorophyll, and pH sensors
- Carbon cycle and ocean acidification
- Deoxygenation and biological pump quantification`,
  },

  // artificial-intelligence | reinforcement-learning
  {
    title: 'Offline Reinforcement Learning from Fixed Datasets',
    discipline: 'artificial-intelligence',
    source: 'paper',
    viewCount: 167,
    metadata: {
      subDiscipline: 'reinforcement-learning',
      tags: ['Offline RL', 'Batch RL', 'Conservative Q-Learning', 'Data-Driven'],
      authors: ['Levine, S.', 'Kumar, A.'],
      year: 2024,
      abstract: 'A review of offline reinforcement learning methods that learn optimal policies from previously collected datasets without online environment interaction.',
    },
    content: `## Offline RL Challenge

Learning from fixed datasets without online exploration requires addressing distributional shift and value overestimation.

## Policy Constraints

- Behavior cloning with residual policy learning
- Advantage-weighted regression
- Implicit Q-learning and expectile regression

## Conservative Methods

- Conservative Q-learning (CQL) with lower bounds
- Pessimistic value iteration
- Model-based pessimism in dynamics learning

## Dataset Quality and Composition

- Coverage requirements for optimal policies
- Trajectory stitching and suboptimal data
- Data augmentation and synthetic transitions

## Applications

- Healthcare treatment optimization from EHRs
- Robotic learning from demonstration datasets
- Recommendation systems and user interaction logs
- Autonomous driving from logged vehicle data`,
  },
]

async function main() {
  let created = 0
  let skipped = 0

  for (const doc of PADDING_DOCS) {
    const existing = await prisma.knowledgeDocument.findFirst({
      where: { title: doc.title },
    })
    if (existing) {
      skipped++
      continue
    }

    await prisma.knowledgeDocument.create({
      data: {
        title: doc.title,
        content: doc.content,
        source: doc.source,
        discipline: doc.discipline,
        viewCount: doc.viewCount,
        metadata: JSON.stringify(doc.metadata),
      },
    })
    created++
  }

  console.log(`Padding batch 2 complete! Created: ${created}, Skipped: ${skipped}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
