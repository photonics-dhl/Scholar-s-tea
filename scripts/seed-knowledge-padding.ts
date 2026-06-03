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
  // ==================== PHYSICS ====================
  {
    title: 'Quantum Monte Carlo Methods for Strongly Correlated Systems',
    discipline: 'physics',
    source: 'paper',
    viewCount: 98,
    metadata: {
      subDiscipline: 'computational-physics',
      tags: ['Quantum Monte Carlo', 'Strong Correlation', 'Numerical Methods', 'Condensed Matter'],
      authors: ['Foulkes, W.M.C.', 'Needs, R.J.'],
      year: 2024,
      abstract: 'A review of quantum Monte Carlo methods for studying strongly correlated electron systems, covering variational, diffusion, and auxiliary-field QMC.',
    },
    content: `## Quantum Monte Carlo Overview

Quantum Monte Carlo (QMC) methods provide stochastic solutions to the many-electron Schrödinger equation with controlled accuracy.

## Variational Monte Carlo

- Trial wavefunction with Jastrow correlation factors
- Optimization of parameters via energy minimization
- Upper-bound property for ground-state energy

## Diffusion Monte Carlo

- Projective imaginary-time evolution
- Fixed-node approximation for fermions
- Systematic bias from nodal surface

## Auxiliary-Field QMC

- Hubbard-Stratonovich transformation
- Finite-temperature path integrals
- Free from sign problem in certain cases

## Applications

- High-pressure hydrogen metallization
- Transition metal oxides
- Quantum chemistry benchmarks`,
  },
  {
    title: 'Cold Atom Physics: Bose-Einstein Condensates and Fermi Gases',
    discipline: 'physics',
    source: 'publication',
    viewCount: 112,
    metadata: {
      subDiscipline: 'atomic-molecular',
      tags: ['Cold Atoms', 'Bose-Einstein Condensate', 'Fermi Gas', 'Quantum Degeneracy'],
      authors: ['Pethick, C.J.', 'Smith, H.'],
      year: 2024,
      abstract: 'An introduction to ultracold atomic physics, covering BECs, degenerate Fermi gases, and optical lattice experiments.',
    },
    content: `## Ultracold Atomic Gases

Laser cooling and evaporative cooling bring atomic gases to nanokelvin temperatures, revealing quantum statistical behavior.

## Bose-Einstein Condensation

- Macroscopic occupation of ground state
- Gross-Pitaevskii mean-field theory
- Collective excitations and vortices

## Degenerate Fermi Gases

- Fermi pressure and Pauli blocking
- BCS-BEC crossover
- Unitary Fermi gas universality

## Optical Lattices

- Periodic potential from standing waves
- Hubbard model emulation
- Mott insulator and superfluid phases

## Applications

- Precision atomic clocks
- Quantum simulation of lattice models
- Atom interferometry for gravimetry`,
  },
  {
    title: 'Cosmological Inflation and Primordial Perturbations',
    discipline: 'physics',
    source: 'paper',
    viewCount: 87,
    metadata: {
      subDiscipline: 'theoretical-physics',
      tags: ['Cosmology', 'Inflation', 'Primordial Perturbations', 'CMB'],
      authors: ['Linde, A.D.', 'Mukhanov, V.'],
      year: 2024,
      abstract: 'A review of inflationary cosmology and the generation of primordial density perturbations that seed large-scale structure.',
    },
    content: `## Inflationary Paradigm

Cosmic inflation proposes a brief period of exponential expansion in the early universe, solving the horizon and flatness problems.

## Single-Field Slow-Roll Inflation

- Inflaton scalar field dynamics
- Slow-roll parameters epsilon and eta
- graceful exit and reheating

## Primordial Perturbations

- Quantum fluctuations stretched to cosmological scales
- Scalar and tensor power spectra
- Consistency relation between r and n_s

## Observational Constraints

- CMB temperature and polarization anisotropies
- B-mode polarization from gravitational waves
- Large-scale structure surveys

## Beyond Single-Field

- Multi-field inflation and isocurvature modes
- Non-Gaussianity as a probe of interactions
- Alternatives to inflation`,
  },
  {
    title: 'Topological Insulators and Weyl Semimetals',
    discipline: 'physics',
    source: 'publication',
    viewCount: 134,
    metadata: {
      subDiscipline: 'condensed-matter',
      tags: ['Topological Insulator', 'Weyl Semimetal', 'Band Topology', 'Spin-Orbit Coupling'],
      authors: ['Hasan, M.Z.', 'Kane, C.L.'],
      year: 2024,
      abstract: 'A review of topological states of matter, including 2D and 3D topological insulators and Weyl semimetals with Fermi arc surface states.',
    },
    content: `## Topological Band Theory

Topology classifies bands by global invariants, leading to robust boundary states protected by symmetries.

## 2D Topological Insulators

- Quantum spin Hall effect
- Helical edge states with time-reversal symmetry
- HgTe/CdTe quantum wells

## 3D Topological Insulators

- Strong and weak Z2 invariants
- Surface Dirac cones
- ARPES and STM observations

## Weyl Semimetals

- Non-degenerate band touching points
- Chiral anomaly and negative magnetoresistance
- Fermi arc surface states connecting Weyl points

## Applications

- Dissipationless spintronics
- Topological quantum computing
- Axion electrodynamics in condensed matter`,
  },

  // ==================== OPTICS ====================
  {
    title: 'Holographic Optical Tweezers for Single-Cell Manipulation',
    discipline: 'optics',
    source: 'publication',
    viewCount: 103,
    metadata: {
      subDiscipline: 'physical-optics',
      tags: ['Optical Tweezers', 'Holography', 'Cell Manipulation', 'Microscopy'],
      authors: ['Dholakia, K.', 'Grier, D.G.'],
      year: 2024,
      abstract: 'A review of holographic optical tweezer systems for parallel trapping and manipulation of biological cells and colloidal particles.',
    },
    content: `## Optical Trapping Fundamentals

Focused laser beams exert piconewton forces on dielectric particles, enabling non-contact manipulation at the microscale.

## Holographic Beam Shaping

- Spatial light modulators for dynamic traps
- Gerchberg-Saxton phase retrieval algorithm
- Real-time reconfiguration of trap arrays

## Single-Cell Applications

- Cell sorting and positioning
- Force spectroscopy of cellular mechanics
- Studies of cell-cell interactions

## Advanced Techniques

- Bessel and Airy beam traps
- Optical vortices with orbital angular momentum
- Counter-propagating tweezer configurations

## Integration with Microscopy

- Combined fluorescence and trap imaging
- High-speed tracking of trapped particles
- Automated feedback control systems`,
  },
  {
    title: 'Metasurface Flat Optics: From Metalenses to Polarization Control',
    discipline: 'optics',
    source: 'paper',
    viewCount: 145,
    metadata: {
      subDiscipline: 'geometric-optics',
      tags: ['Metasurface', 'Flat Optics', 'Metalens', 'Polarization'],
      authors: ['Capasso, F.', 'Khorasaninejad, M.'],
      year: 2024,
      abstract: 'An overview of optical metasurfaces enabling subwavelength-thick lenses, holograms, and polarization devices with engineered phase response.',
    },
    content: `## Metasurface Design Principles

Subwavelength antenna arrays impart spatially varying phase, amplitude, and polarization responses to incident light.

## Metalenses

- Achromatic and chromatic designs
- Numerical aperture and efficiency trade-offs
- Visible and near-infrared operation

## Polarization Control

- Geometric (Pancharatnam-Berry) phase
- Dielectric metasurface birefringence
- Full Poincaré sphere coverage

## Holographic Metasurfaces

- Computer-generated holograms
- Multi-wavelength and angle-multiplexed designs
- Dynamic tuning via liquid crystals

## Applications

- Miniaturized imaging systems
- Polarization cameras
- Augmented reality displays
- Structured light generation`,
  },
  {
    title: 'High-Harmonic Generation in Solids and Gases',
    discipline: 'optics',
    source: 'paper',
    viewCount: 119,
    metadata: {
      subDiscipline: 'nonlinear-optics',
      tags: ['High-Harmonic Generation', 'Attosecond Pulses', 'Strong Field', 'Nonlinear Optics'],
      authors: ['Ghimire, S.', 'Kapteyn, H.C.'],
      year: 2024,
      abstract: 'A review of high-harmonic generation in atomic gases and crystalline solids, enabling attosecond pulse trains and ultrafast spectroscopy.',
    },
    content: `## High-Harmonic Generation Basics

Intense femtosecond lasers drive nonlinear polarization, producing coherent extreme-ultraviolet and soft X-ray radiation.

## Gas-Phase HHG

- Three-step model: ionization, propagation, recombination
- Attosecond pulse train generation
- Isolated attosecond pulse via gating

## Solid-State HHG

- Interband and intraband contributions
- Berry phase and Bloch oscillations
- Crystal orientation dependence

## Attosecond Metrology

- Attosecond streak camera
- Reconstruction of optical field waveforms
- Electron dynamics in atoms and molecules

## Applications

- Ultrafast magnetization dynamics
- Core-level spectroscopy with attosecond resolution
- Tabletop coherent X-ray sources`,
  },
  {
    title: 'Nanophotonic Near-Field Enhancement for Single-Molecule Sensing',
    discipline: 'optics',
    source: 'publication',
    viewCount: 156,
    metadata: {
      subDiscipline: 'nano-optics',
      tags: ['Near-Field Optics', 'Single Molecule', 'Nanophotonics', 'SERS'],
      authors: ['Novotny, L.', 'Van Hulst, N.'],
      year: 2024,
      abstract: 'A review of nanophotonic structures for extreme near-field confinement, enabling single-molecule fluorescence and Raman spectroscopy.',
    },
    content: `## Near-Field Optics Principles

Sub-diffraction confinement of light at nanostructures creates electromagnetic hotspots with orders-of-magnitude enhancement.

## Plasmonic Nanostructures

- Gold and silver nanoparticle dimers
- Nanogap antennas and bowtie structures
- Fano resonances for spectral selectivity

## Single-Molecule Detection

- Surface-enhanced Raman scattering (SERS)
- Tip-enhanced Raman spectroscopy (TERS)
- Fluorescence enhancement and quenching

## Dielectric Nanoantennas

- Mie resonances in silicon and germanium
- Low-loss alternatives to plasmonics
- Directional scattering and Huygens sources

## Applications

- Label-free biosensing with zeptomolar sensitivity
- Photocatalysis enhancement
- Quantum emitter coupling
- Nanoscale thermometry`,
  },

  // ==================== PHOTONICS ====================
  {
    title: 'Optical Neural Networks with Silicon Photonic Tensor Cores',
    discipline: 'photonics',
    source: 'paper',
    viewCount: 167,
    metadata: {
      subDiscipline: 'optical-computing',
      tags: ['Optical Computing', 'Neural Network', 'Silicon Photonics', 'Matrix Multiplication'],
      authors: ['Shen, Y.', 'Harris, N.C.'],
      year: 2024,
      abstract: 'A review of optical neural network accelerators using silicon photonic mesh networks for energy-efficient matrix-vector multiplication.',
    },
    content: `## Photonic Matrix Operations

Interferometric mesh networks of Mach-Zehnder modulators implement unitary transformations for optical matrix multiplication.

## Silicon Photonic Implementations

- Reconfigurable triangular mesh architectures
- Phase shifter technologies: thermo-optic and electro-optic
- CMOS-compatible fabrication

## Training and Inference

- In-situ backpropagation through photonic circuits
- Calibration of phase errors and crosstalk
- Analog vs. digital weight storage

## Performance Metrics

- Multiply-accumulate operations per second
- Energy efficiency vs. electronic GPUs
- Latency advantages of optical processing

## Challenges and Outlook

- Scalability to large matrix dimensions
- ADC/DAC bottleneck at interfaces
- Hybrid electro-optical architectures`,
  },
  {
    title: 'Hollow-Core Photonic Bandgap Fibers for Ultralow-Latency Communication',
    discipline: 'photonics',
    source: 'publication',
    viewCount: 132,
    metadata: {
      subDiscipline: 'fiber-photonics',
      tags: ['Hollow-Core Fiber', 'Photonic Bandgap', 'Ultralow Latency', 'Optical Communication'],
      authors: ['Russell, P.St.J.', 'Knight, J.C.'],
      year: 2024,
      abstract: 'A review of hollow-core photonic bandgap fibers enabling light guidance in air with reduced latency and nonlinear distortion.',
    },
    content: `## Hollow-Core Fiber Principles

Photonic bandgap structures confine light to an air core, reducing group delay and eliminating material nonlinearities.

## Bandgap Design

- Kagome and anti-resonant reflecting structures
- Spectral bandwidth and loss trade-offs
- Modal content and single-mode operation

## Loss Mechanisms

- Surface scattering at cladding interfaces
- Leakage through finite cladding layers
- Record losses approaching 0.1 dB/km

## Latency Benefits

- Group velocity close to c in air
- 30-40% latency reduction vs. silica fibers
- Importance for high-frequency trading and 5G fronthaul

## Nonlinear and Power Handling

- Elimination of Raman and Brillouin scattering
- High-power delivery for industrial lasers
- Gas-filled fibers for nonlinear optics`,
  },
  {
    title: 'Quantum Plasmonics: Single-Photon Sources and Strong Coupling',
    discipline: 'photonics',
    source: 'paper',
    viewCount: 143,
    metadata: {
      subDiscipline: 'nano-optics',
      tags: ['Quantum Plasmonics', 'Single Photon', 'Strong Coupling', 'Nanocavity'],
      authors: ['Tame, M.S.', 'Chang, D.E.'],
      year: 2024,
      abstract: 'A review of quantum plasmonic systems exploring nanoscale light-matter interaction for single-photon generation and strong coupling.',
    },
    content: `## Quantum Plasmonics Overview

Plasmonic nanostructures confine light to subwavelength volumes, enhancing quantum light-matter interactions beyond diffraction limits.

## Single-Photon Sources

- Color centers in diamond coupled to plasmonic antennas
- Quantum dots in plasmonic gap cavities
- Purcell enhancement and collection efficiency

## Strong Coupling Regime

- plexcitons: hybrid plasmon-exciton states
- Rabi splitting in J-aggregate plasmon systems
- Room-temperature strong coupling

## Plasmon-Photon Conversion

- Efficient outcoupling from nanoscale modes
- Directional emission via Yagi-Uda antennas
- Fiber-coupled plasmonic devices

## Applications

- Quantum information processing
- Subdiffraction optical microscopy
- Sensing with quantum-limited sensitivity
- Nonlinear quantum optics at the nanoscale`,
  },
  {
    title: 'Topological Edge States in Coupled Photonic Ring Resonators',
    discipline: 'photonics',
    source: 'paper',
    viewCount: 121,
    metadata: {
      subDiscipline: 'topological-photonics',
      tags: ['Topological Photonics', 'Edge States', 'Ring Resonator', 'Photonic Crystal'],
      authors: ['Hafezi, M.', 'Rechtsman, M.C.'],
      year: 2024,
      abstract: 'An overview of topological photonic lattices using coupled ring resonators, demonstrating robust edge states immune to disorder.',
    },
    content: `## Photonic Topological Insulators

Engineered photonic lattices with broken symmetries support topologically protected boundary modes with unidirectional propagation.

## Coupled Ring Resonator Lattices

- Synthetic magnetic flux via path-dependent phase
- Haldane and Floquet topological models
- Aubry-Andre-Harper quasiperiodic structures

## Edge State Characterization

- Unidirectional transport around defects
- Robustness to disorder and fabrication imperfections
- Pseudospin and valley degrees of freedom

## Nonlinear Topological Photonics

- Topological solitons in Su-Schrieffer-Heeger lattices
- Self-localization in edge states
- Topological frequency combs

## Experimental Platforms

- Silicon nitride microring arrays
- Laser-written waveguide lattices in glass
- Polariton microcavity honeycomb lattices`,
  },
  {
    title: 'Lithium Niobate on Insulator for Electro-Optic Modulators',
    discipline: 'photonics',
    source: 'publication',
    viewCount: 156,
    metadata: {
      subDiscipline: 'integrated-photonics',
      tags: ['Lithium Niobate', 'Electro-Optic Modulator', 'Integrated Photonics', 'Thin Film'],
      authors: ['Boes, A.', 'Mitchell, A.'],
      year: 2024,
      abstract: 'A review of lithium niobate on insulator (LNOI) platform for high-performance electro-optic modulators with low drive voltage and broadband operation.',
    },
    content: `## LNOI Platform Advantages

Lithium niobate on insulator combines strong Pockels effect, wide transparency window, and CMOS-compatible thin-film processing.

## Modulator Designs

- Microring and Mach-Zehnder modulators
- Traveling-wave electrode configurations
- Adiabatic coupling for high extinction

## Performance Metrics

- Ultra-low half-wave voltages (Vπ < 1 V)
- High bandwidth exceeding 100 GHz
- Low insertion loss (< 1 dB)

## Integration Challenges

- Fiber-to-chip coupling efficiency
- Scalable heterogeneous integration with lasers
- Packaging and thermal management

## Emerging Applications

- Microwave photonic signal processing
- Quantum key distribution systems
- Optical phased arrays for LiDAR`,
  },

  // ==================== MATERIALS SCIENCE ====================
  {
    title: 'Carbon Nanotube Synthesis and Electronic Properties',
    discipline: 'materials-science',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'nanomaterials',
      tags: ['Carbon Nanotube', 'CVD Synthesis', 'Electronic Properties', 'Nanomaterial'],
      authors: ['Dai, H.', 'Jorio, A.'],
      year: 2024,
      abstract: 'A review of carbon nanotube synthesis by chemical vapor deposition and their chirality-dependent electronic and optical properties.',
    },
    content: `## Carbon Nanotube Structure

Single-wall carbon nanotubes are rolled graphene sheets with chiral indices (n,m) determining metallic or semiconducting behavior.

## Synthesis Methods

- Chemical vapor deposition on catalyst particles
- Floating catalyst and substrate-aligned growth
- Plasma-enhanced CVD for low-temperature growth

## Chirality Control

- Epitaxial growth on single-crystal substrates
- Cloning from seed nanotubes
- Post-growth sorting by density-gradient ultracentrifugation

## Electronic Transport

- Ballistic conduction and quantum resistance
- Contact engineering for Ohmic contacts
- Threshold voltage control in FET devices

## Applications

- High-frequency transistors exceeding 100 GHz
- Flexible transparent electrodes
- Electrochemical sensors and supercapacitors`,
  },
  {
    title: 'Wide-Bandgap GaN and SiC Power Semiconductors',
    discipline: 'materials-science',
    source: 'publication',
    viewCount: 145,
    metadata: {
      subDiscipline: 'semiconductors',
      tags: ['GaN', 'SiC', 'Wide Bandgap', 'Power Electronics'],
      authors: ['Mishra, U.K.', 'Singisetti, U.'],
      year: 2024,
      abstract: 'A review of wide-bandgap semiconductor materials GaN and SiC for next-generation power electronics with higher efficiency and switching frequency.',
    },
    content: `## Wide-Bandgap Advantages

GaN and SiC offer superior breakdown fields, thermal conductivity, and electron mobility compared to silicon.

## Gallium Nitride (GaN)

- HEMT structures with 2D electron gas
- Lateral vs. vertical device architectures
- E-mode and D-mode operation

## Silicon Carbide (SiC)

- Polytype selection: 4H-SiC for power devices
- Bulk crystal growth by PVT method
- MOSFET and Schottky diode technologies

## Reliability and Packaging

- Dynamic on-resistance degradation in GaN
- Gate oxide reliability in SiC MOSFETs
- Advanced packaging for thermal management

## Applications

- Electric vehicle powertrains and chargers
- Renewable energy inverters
- Data center power supplies
- 5G base station RF amplifiers`,
  },
  {
    title: 'Lead-Free Halide Perovskites for Optoelectronic Devices',
    discipline: 'materials-science',
    source: 'paper',
    viewCount: 123,
    metadata: {
      subDiscipline: 'optoelectronic-materials',
      tags: ['Lead-Free Perovskite', 'Tin Perovskite', 'Optoelectronics', 'Green Energy'],
      authors: ['Noel, N.K.', 'Snaith, H.J.'],
      year: 2024,
      abstract: 'A review of lead-free halide perovskite materials, focusing on tin-based alternatives and strategies to improve stability against oxidation.',
    },
    content: `## Motivation for Lead-Free Perovskites

Toxicity concerns and environmental regulations drive research into lead-free halide perovskite alternatives.

## Tin-Based Perovskites

- ASnX3 compositions with similar bandgaps to lead analogs
- Tin oxidation: Sn²⁺ to Sn⁴⁺ and p-type self-doping
- Antioxidant additives and solvent engineering

## Double Perovskites

- Cs2AgBiBr6 and related halide double perovskites
- Indirect bandgaps limiting absorption
- Bismuth and antimony alternatives

## Stability Enhancement

- 2D/3D heterostructure passivation
- Encapsulation and barrier layers
- Reduced-dimensional tin perovskites

## Device Performance

- Lead-free solar cells approaching 15% efficiency
- Near-infrared LEDs and photodetectors
- Scalability challenges for commercialization`,
  },
  {
    title: 'Mechanical Metamaterials with Programmable Properties',
    discipline: 'materials-science',
    source: 'paper',
    viewCount: 118,
    metadata: {
      subDiscipline: 'metamaterials',
      tags: ['Mechanical Metamaterial', 'Programmable Matter', 'Lattice Structure', 'Auxetic'],
      authors: ['Bertoldi, K.', 'Kochmann, D.M.'],
      year: 2024,
      abstract: 'A review of architected mechanical metamaterials with unusual elastic properties including negative Poisson ratio and programmable deformation.',
    },
    content: `## Architected Material Design

Geometric arrangement of base materials creates effective properties unattainable in bulk solids.

## Auxetic Materials

- Negative Poisson ratio behavior
- Re-entrant honeycomb and rotating square mechanisms
- Enhanced indentation resistance and shear modulus

## Programmable Deformation

- Multistable unit cells with snapping transitions
- Sequential folding and origami-inspired designs
- Magnetoactive and thermoactive actuation

## Topology Optimization

- Density-based and level-set methods
- Stress-constrained and buckling optimization
- Additive manufacturing constraints

## Applications

- Soft robotics and compliant mechanisms
- Biomedical implants with patient-specific stiffness
- Impact-absorbing structures and packaging
- Reconfigurable antennas and waveguides`,
  },

  // ==================== CHEMISTRY ====================
  {
    title: 'Ab Initio Molecular Dynamics for Reaction Mechanisms',
    discipline: 'chemistry',
    source: 'paper',
    viewCount: 97,
    metadata: {
      subDiscipline: 'computational-chemistry',
      tags: ['Ab Initio MD', 'Car-Parrinello', 'Reaction Mechanism', 'DFT'],
      authors: ['Car, R.', 'Parrinello, M.'],
      year: 2024,
      abstract: 'A review of ab initio molecular dynamics methods combining density functional theory with finite-temperature dynamics for chemical reaction studies.',
    },
    content: `## Ab Initio Molecular Dynamics

AIMD combines electronic structure calculations with classical or quantum nuclear dynamics without empirical force fields.

## Born-Oppenheimer MD

- Self-consistent field at each time step
- Time-reversible integration schemes
- Energy conservation and accuracy trade-offs

## Car-Parrinello MD

- Unified Lagrangian for electrons and nuclei
- Fictitious electron mass and adiabaticity
- Computational efficiency for large systems

## Enhanced Sampling

- Metadynamics and free energy reconstruction
- Umbrella sampling and steered MD
- Transition path sampling for rare events

## Applications

- Proton transfer in aqueous environments
- Heterogeneous catalysis at metal surfaces
- Battery electrolyte decomposition
- Enzyme reaction mechanisms`,
  },
  {
    title: 'Electrocatalytic Nitrogen Reduction to Ammonia',
    discipline: 'chemistry',
    source: 'paper',
    viewCount: 112,
    metadata: {
      subDiscipline: 'physical-chemistry',
      tags: ['Nitrogen Reduction', 'Electrocatalysis', 'Ammonia Synthesis', 'Sustainable Chemistry'],
      authors: ['Norskov, J.K.', 'Bagger, A.'],
      year: 2024,
      abstract: 'A review of electrocatalytic nitrogen fixation under ambient conditions, comparing metal catalysts and single-atom sites for N2 reduction.',
    },
    content: `## Electrochemical N2 Reduction

Ambient-condition electrochemical nitrogen reduction offers an alternative to energy-intensive Haber-Bosch process.

## Catalyst Materials

- Transition metals: Fe, Mo, and Ru nanoparticles
- Single-atom catalysts on carbon substrates
- Nitride and carbide compounds

## Mechanistic Understanding

- Associative vs. dissociative pathways
- Limiting potential and scaling relations
- Competition with hydrogen evolution reaction

## Experimental Challenges

- Ammonia quantification and contamination control
- Isotope labeling with 15N2 verification
- Faradaic efficiency and ammonia yield metrics

## System Design

- Gas diffusion electrodes for mass transport
- Solid-state electrolytes for selectivity
- Solar-driven integrated reactors`,
  },
  {
    title: 'Asymmetric Organocatalysis with Chiral Amines',
    discipline: 'chemistry',
    source: 'publication',
    viewCount: 89,
    metadata: {
      subDiscipline: 'organic-chemistry',
      tags: ['Organocatalysis', 'Asymmetric Synthesis', 'Chiral Amine', 'Enantioselective'],
      authors: ['List, B.', 'MacMillan, D.W.C.'],
      year: 2024,
      abstract: 'A review of chiral amine organocatalysts for enantioselective carbonyl transformations including aldol, Mannich, and Michael reactions.',
    },
    content: `## Organocatalysis Principles

Small organic molecules catalyze reactions with high enantioselectivity through covalent and non-covalent activation modes.

## Enamine Catalysis

- Proline and diarylprolinol derivatives
- Aldol reactions with high dr and ee
- Cross-aldol and intramolecular variants

## Iminium Catalysis

- Activation of alpha,beta-unsaturated aldehydes
- Conjugate addition of nucleophiles
- Diels-Alder and 1,3-dipolar cycloadditions

## SOMO and Photoredox Catalysis

- Single-electron oxidation of enamines
- Merge of organocatalysis with photoredox
- Radical-based bond-forming strategies

## Applications in Synthesis

- Natural product total synthesis
- Pharmaceutical intermediate preparation
- Industrial scale-up of organocatalytic processes`,
  },
  {
    title: 'Metal-Organic Frameworks for Catalysis and Gas Storage',
    discipline: 'chemistry',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'materials-chemistry',
      tags: ['MOF', 'Metal-Organic Framework', 'Catalysis', 'Gas Storage'],
      authors: ['Yaghi, O.M.', 'Farha, O.K.'],
      year: 2024,
      abstract: 'A review of metal-organic frameworks as tunable porous materials for heterogeneous catalysis, gas separation, and energy storage applications.',
    },
    content: `## MOF Design Principles

Reticular chemistry enables precise control over pore size, shape, and functionality through linker and metal node selection.

## Structural Diversity

- ZIFs, UiOs, MILs, and COFs
- Mixed-linker and multivariate approaches
- Defect engineering for enhanced reactivity

## Catalytic Applications

- Encapsulated molecular catalysts
- Metal nanoparticle@MOF composites
- Lewis acidic sites for organic transformations

## Gas Storage and Separation

- Hydrogen storage at cryogenic temperatures
- Methane storage for vehicular applications
- CO2 capture from flue gas and direct air

## Stability and Processability

- Water-stable MOFs for industrial conditions
- MOF membranes for continuous separations
- Scale-up via electrochemical and mechanochemical synthesis`,
  },

  // ==================== BIOLOGY ====================
  {
    title: 'Molecular Dynamics of Membrane Proteins in Lipid Bilayers',
    discipline: 'biology',
    source: 'paper',
    viewCount: 103,
    metadata: {
      subDiscipline: 'biophysics',
      tags: ['Membrane Protein', 'Molecular Dynamics', 'Lipid Bilayer', 'GPCR'],
      authors: ['Dror, R.O.', 'Shaw, D.E.'],
      year: 2024,
      abstract: 'A review of molecular dynamics simulations of membrane proteins, focusing on GPCR activation mechanisms and ion channel gating.',
    },
    content: `## Membrane Protein Simulation

All-atom MD simulations capture conformational dynamics of membrane proteins embedded in realistic lipid environments.

## GPCR Activation

- Inactive to active state transitions
- Role of cholesterol and lipid composition
- G-protein and arrestin coupling pathways

## Ion Channel Gating

- Voltage-gated sodium and potassium channels
- Selectivity filter dynamics and ion permeation
- Allosteric coupling between voltage sensor and pore

## Enhanced Sampling Methods

- Markov state models for long timescales
- Metadynamics and umbrella sampling
- Weighted ensemble path sampling

## Force Field Development

- Lipid parameter optimization
- Polarizable force fields for ion coordination
- Machine learning potentials for QM accuracy`,
  },
  {
    title: 'Cell-Free Synthetic Biology and Cell-Free Protein Synthesis',
    discipline: 'biology',
    source: 'publication',
    viewCount: 87,
    metadata: {
      subDiscipline: 'synthetic-biology',
      tags: ['Cell-Free', 'TX-TL', 'Protein Synthesis', 'Rapid Prototyping'],
      authors: ['Jewett, M.C.', 'Silver, P.A.'],
      year: 2024,
      abstract: 'A review of cell-free transcription-translation systems enabling rapid prototyping of genetic circuits and on-demand protein production.',
    },
    content: `## Cell-Free Systems Overview

Crude or purified cellular extracts support transcription and translation without intact cells, accelerating design-build-test cycles.

## TX-TL Platforms

- E. coli lysate-based systems
- PURE system with recombinant factors
- CHO and wheat germ eukaryotic extracts

## Genetic Circuit Prototyping

- Rapid testing of promoters and ribozymes
- Characterization of regulatory elements
- Cell-free metabolic engineering

## Protein Production

- Incorporation of non-canonical amino acids
- Disulfide-bonded and membrane protein synthesis
- Continuous-exchange formats for yield improvement

## Applications

- On-demand therapeutic protein manufacturing
- Biosensors and diagnostic assays
- Educational kits for synthetic biology training
- Space biotechnology for long-duration missions`,
  },
  {
    title: 'Neural Population Coding in the Visual Cortex',
    discipline: 'biology',
    source: 'paper',
    viewCount: 119,
    metadata: {
      subDiscipline: 'neuroscience',
      tags: ['Neural Coding', 'Visual Cortex', 'Population Activity', 'Decoding'],
      authors: ['Tolias, A.S.', 'Paninski, L.'],
      year: 2024,
      abstract: 'A review of neural population coding in visual cortex, examining how distributed activity patterns represent visual stimuli and support perception.',
    },
    content: `## Population Coding Principles

Visual information is encoded by distributed patterns of activity across neural populations rather than single neurons.

## Receptive Field Properties

- Orientation and spatial frequency tuning
- Color opponency and motion direction selectivity
- Hierarchical processing from V1 to IT cortex

## Dimensionality Reduction

- Principal component analysis of population activity
- Manifold structure of neural state space
- Low-dimensional dynamics underlying behavior

## Decoding and Brain-Machine Interfaces

- Linear and nonlinear decoding algorithms
- Kalman filters for continuous trajectory estimation
- Neural prosthetics for motor restoration

## Computational Models

- Deep neural networks as models of visual cortex
- Predictive coding and Bayesian inference
- Attention mechanisms in neural circuits`,
  },
  {
    title: 'Single-Cell CRISPR Screening for Gene Regulation',
    discipline: 'biology',
    source: 'paper',
    viewCount: 145,
    metadata: {
      subDiscipline: 'molecular-biology',
      tags: ['CRISPR Screening', 'Single Cell', 'Perturb-seq', 'Gene Regulation'],
      authors: ['Weissman, J.S.', 'Dixit, A.'],
      year: 2024,
      abstract: 'A review of single-cell CRISPR screening methods combining pooled perturbations with transcriptomic readouts for gene regulatory network mapping.',
    },
    content: `## Perturb-seq Technology

Pooled CRISPR screens with single-cell RNA sequencing readouts enable high-throughput gene function mapping at single-cell resolution.

## Experimental Designs

- CRISPR KO, CRISPRi, and CRISPRa modalities
- sgRNA capture strategies: CROP-seq and direct capture
- Combinatorial perturbation screens

## Data Analysis

- sgRNA assignment to individual cells
- Differential expression per perturbation
- Gene regulatory network inference

## Biological Discoveries

- Uncharacterized gene functions
- Synthetic lethal interactions in cancer
- Drug target mechanism elucidation

## Emerging Directions

- Multi-modal single-cell profiling
- In vivo Perturb-seq in model organisms
- Base editing and prime editing screens`,
  },
  {
    title: 'Next-Generation Sequencing and Genome Assembly Algorithms',
    discipline: 'biology',
    source: 'publication',
    viewCount: 156,
    metadata: {
      subDiscipline: 'biomedical-science',
      tags: ['NGS', 'Genome Assembly', 'De Bruijn Graph', 'Long Reads'],
      authors: ['Myers, E.W.', 'Phillippy, A.M.'],
      year: 2024,
      abstract: 'A review of genome assembly algorithms for short and long read sequencing data, covering de Bruijn graph and overlap-layout-consensus approaches.',
    },
    content: `## Sequencing Technologies

Illumina short reads, PacBio HiFi, and Oxford Nanopore long reads each present distinct assembly challenges and opportunities.

## De Bruijn Graph Assembly

- K-mer decomposition and graph construction
- Error correction and bubble popping
- Contig construction and scaffolding

## Long-Read Assembly

- Overlap-layout-consensus (OLC) pipelines
- Hifiasm and Verkko for telomere-to-telomere assembly
- T2T-CHM13 human reference completion

## Metagenome Assembly

- Binning strategies for mixed communities
- Strain-level resolution from metagenomes
- Viral and plasmid sequence recovery

## Quality Assessment

- BUSCO completeness metrics
- Merqury QV scores
- Assembly graph topology analysis`,
  },

  // ==================== MATHEMATICS ====================
  {
    title: 'Integer Programming and Branch-and-Bound Methods',
    discipline: 'mathematics',
    source: 'paper',
    viewCount: 76,
    metadata: {
      subDiscipline: 'optimization',
      tags: ['Integer Programming', 'Branch and Bound', 'Combinatorial Optimization', 'LP Relaxation'],
      authors: ['Nemhauser, G.L.', 'Wolsey, L.A.'],
      year: 2024,
      abstract: 'A review of integer programming formulations and branch-and-bound algorithms with cutting planes for discrete optimization problems.',
    },
    content: `## Integer Programming Formulations

Binary and integer variables model discrete decisions in scheduling, routing, and resource allocation problems.

## Branch-and-Bound Framework

- LP relaxation for lower bounds
- Branching strategies: most fractional, strong branching
- Node selection: depth-first vs. best-bound

## Cutting Planes

- Gomory mixed-integer cuts
- Cover cuts for knapsack constraints
- Split cuts and lattice-free sets

## Modern Solver Techniques

- Presolve and symmetry detection
- Heuristic primal solutions
- Parallel branch-and-bound implementations

## Applications

- Vehicle routing and facility location
- Portfolio optimization with cardinality constraints
- Power generation unit commitment`,
  },
  {
    title: 'Spectral Methods for Solving Partial Differential Equations',
    discipline: 'mathematics',
    source: 'paper',
    viewCount: 82,
    metadata: {
      subDiscipline: 'computational-mathematics',
      tags: ['Spectral Method', 'Fourier', 'Chebyshev', 'PDE'],
      authors: ['Trefethen, L.N.', 'Gottlieb, D.'],
      year: 2024,
      abstract: 'A review of spectral methods using Fourier and Chebyshev polynomial expansions for high-accuracy numerical solution of PDEs.',
    },
    content: `## Spectral Approximation Theory

Global polynomial expansions achieve exponential convergence for smooth problems, outperforming finite differences and finite elements.

## Fourier Spectral Methods

- Discrete Fourier transform on periodic domains
- Aliasing and dealiasing techniques
- Pseudospectral differentiation matrices

## Chebyshev Spectral Methods

- Gauss-Lobatto collocation points
- Polynomial interpolation and quadrature
- Clenshaw-Curtis integration

## Time Integration

- Implicit-explicit (IMEX) schemes for stiff terms
- Runge-Kutta and linear multistep methods
- Exponential time differencing

## Complex Geometry Handling

- Spectral element and mortar methods
- Mapped domains and coordinate transforms
- Domain decomposition for parallel computing`,
  },
  {
    title: 'Causal Inference with Instrumental Variables',
    discipline: 'mathematics',
    source: 'paper',
    viewCount: 94,
    metadata: {
      subDiscipline: 'statistics',
      tags: ['Causal Inference', 'Instrumental Variable', 'Econometrics', 'Observational Data'],
      authors: ['Angrist, J.D.', 'Imbens, G.W.'],
      year: 2024,
      abstract: 'A review of instrumental variable methods for causal inference when treatment assignment is confounded but an instrument is available.',
    },
    content: `## Instrumental Variables Framework

An instrument affects treatment but has no direct effect on the outcome except through treatment, enabling causal identification.

## Two-Stage Least Squares

- First stage: regress treatment on instrument
- Second stage: regress outcome on predicted treatment
- Standard errors and weak instrument diagnostics

## Local Average Treatment Effect

- LATE for compliers under monotonicity
- Intent-to-treat vs. treatment-on-treated
- External validity of compiler-specific effects

## Modern Extensions

- Machine learning for first-stage prediction
- Multiple instruments and overidentification tests
- Continuous instruments and control functions

## Applications

- Randomized encouragement designs
- Natural experiments and policy evaluation
- Mendelian randomization in genetics`,
  },
  {
    title: 'Graph Neural Networks for Combinatorial Optimization',
    discipline: 'mathematics',
    source: 'paper',
    viewCount: 112,
    metadata: {
      subDiscipline: 'applied-mathematics',
      tags: ['Graph Neural Network', 'Combinatorial Optimization', 'Learning to Optimize', 'TSP'],
      authors: ['Bengio, Y.', 'Vinyals, O.'],
      year: 2024,
      abstract: 'A review of graph neural network approaches to combinatorial optimization problems including TSP, MaxCut, and facility location.',
    },
    content: `## Learning to Optimize

Neural networks trained on problem instances learn heuristics that generalize to unseen inputs, complementing exact solvers.

## GNN Architectures

- Message passing on constraint graphs
- Attention mechanisms for node interactions
- Hierarchical graph pooling and coarsening

## Problem-Specific Approaches

- Pointer networks for TSP
- Policy gradient reinforcement learning
- Imitation learning from OR solvers

## Integration with Classical Methods

- Warm-starting branch-and-bound with neural predictions
- Primal heuristics from learned solutions
- Variable selection guidance

## Theoretical Understanding

- Expressive power of GNNs for graph properties
- Generalization bounds and sample complexity
- Approximation guarantees for learned heuristics`,
  },

  // ==================== ENGINEERING ====================
  {
    title: 'Free-Space Optical Communication for Satellite Networks',
    discipline: 'engineering',
    source: 'paper',
    viewCount: 123,
    metadata: {
      subDiscipline: 'optical-engineering',
      tags: ['Free-Space Optics', 'Satellite Communication', 'Lasercom', 'Atmospheric Turbulence'],
      authors: ['Boroson, D.M.', 'Robinson, B.S.'],
      year: 2024,
      abstract: 'A review of free-space optical communication links for satellite constellations, addressing atmospheric turbulence and acquisition challenges.',
    },
    content: `## Laser Communication in Space

Free-space optical links offer higher bandwidth and lower size, weight, and power than RF systems for satellite communication.

## Link Budget Analysis

- Transmitter power and aperture size
- Atmospheric transmission windows
- Background noise and detector sensitivity

## Atmospheric Effects

- Turbulence-induced scintillation and fading
- Adaptive optics for ground stations
- Site diversity and predictive models

## Acquisition, Tracking, and Pointing

- Beacon-aided acquisition sequences
- Fine tracking with quadrant detectors
- Vibration rejection and platform stabilization

## Constellation Networking

- Crosslinks between LEO satellites
- Optical ground station networks
- Interoperability with RF feeder links`,
  },
  {
    title: 'Perovskite and Organic Solar Cells: Efficiency and Stability',
    discipline: 'engineering',
    source: 'publication',
    viewCount: 145,
    metadata: {
      subDiscipline: 'energy-engineering',
      tags: ['Perovskite Solar Cell', 'Organic Photovoltaic', 'Tandem', 'Stability'],
      authors: ['Green, M.A.', 'Sargent, E.H.'],
      year: 2024,
      abstract: 'A review of perovskite and organic solar cell technologies, covering efficiency records, stability challenges, and tandem architectures.',
    },
    content: `## Third-Generation Photovoltaics

Perovskite and organic solar cells offer low-cost, lightweight alternatives to silicon with tunable bandgaps and flexible form factors.

## Perovskite Solar Cells

- ABX3 crystal structure and bandgap tuning
- Mixed cation and mixed halide compositions
- Certified efficiencies exceeding 26%

## Organic Photovoltaics

- Donor-acceptor bulk heterojunctions
- Non-fullerene acceptor molecules
- Ternary and quaternary blends

## Tandem Architectures

- Perovskite/silicon two-terminal tandems
- All-perovskite tandem with Sn-Pb alloys
- Ideal bandgap combinations and current matching

## Stability and Encapsulation

- Ion migration and phase decomposition
- Moisture and oxygen barrier films
- International testing protocols (ISOS)`,
  },
  {
    title: 'Soft Pneumatic Actuators for Robotic Grippers',
    discipline: 'engineering',
    source: 'paper',
    viewCount: 98,
    metadata: {
      subDiscipline: 'mechanical-engineering',
      tags: ['Soft Actuator', 'Pneumatic', 'Robotic Gripper', 'Compliant Mechanism'],
      authors: ['Shepherd, R.F.', 'Tolley, M.T.'],
      year: 2024,
      abstract: 'A review of soft pneumatic actuator designs for robotic grippers, covering fiber-reinforced, pleated, and origami-inspired structures.',
    },
    content: `## Soft Robotics Motivation

Soft actuators enable compliant interaction with fragile and irregular objects, expanding robotic capabilities beyond rigid systems.

## Pneumatic Actuator Designs

- McKibben muscle and PneuNet bending actuators
- Fiber-reinforced elastomeric enclosures
- Pleated and origami-inspired folding structures

## Modeling and Control

- Finite element analysis of hyperelastic materials
- Kinematic models based on constant curvature
- Closed-loop pressure and position control

## Fabrication Methods

- Mold casting with silicone elastomers
- 3D printing of soft materials
- Hybrid rigid-soft multimaterial printing

## Applications

- Food handling and agricultural harvesting
- Assistive wearable devices
- Minimally invasive surgical tools
- Underwater exploration grippers`,
  },
  {
    title: 'RF CMOS Power Amplifiers for 5G mmWave Systems',
    discipline: 'engineering',
    source: 'paper',
    viewCount: 112,
    metadata: {
      subDiscipline: 'electronic-engineering',
      tags: ['Power Amplifier', '5G', 'mmWave', 'CMOS', 'Doherty'],
      authors: ['Razavi, B.', 'Rebeiz, G.M.'],
      year: 2024,
      abstract: 'A review of RF CMOS power amplifier designs for 5G millimeter-wave systems, covering linearization, efficiency enhancement, and beamforming.',
    },
    content: `## 5G mmWave Requirements

Millimeter-wave bands (24-71 GHz) enable high-data-rate 5G communication but impose stringent PA efficiency and linearity requirements.

## CMOS PA Architectures

- Cascode and stacked-transistor designs
- Neutralization and transformer coupling
- Doherty and outphasing efficiency enhancement

## Linearity and Digital Predistortion

- ACLR and EVM specifications
- Memory polynomial DPD algorithms
- LUT-based and neural network predistortion

## Phased Array Integration

- Element-level PA and phase shifter
- Beamforming gain and power combining
- Thermal management in dense arrays

## Packaging and Testing

- Antenna-in-package and wafer-level packaging
- Over-the-air characterization
- Modular and scalable array architectures`,
  },

  // ==================== COMPUTER SCIENCE ====================
  {
    title: 'Software-Defined Networking and Network Function Virtualization',
    discipline: 'computer-science',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'networks',
      tags: ['SDN', 'NFV', 'OpenFlow', 'Network Virtualization'],
      authors: ['Kreutz, D.', 'Feamster, N.'],
      year: 2024,
      abstract: 'A review of software-defined networking and network function virtualization architectures for programmable and scalable networks.',
    },
    content: `## SDN Architecture

Decoupling of control plane from data plane enables centralized network management and dynamic policy enforcement.

## OpenFlow and Southbound APIs

- Match-action table pipeline
- Flow entry priorities and timeouts
- Alternative protocols: P4, NETCONF, gRPC

## Network Function Virtualization

- Virtual network functions on commodity servers
- Service function chaining
- ETSI NFV reference architecture

## Control Plane Design

- Distributed controller consistency
- Network state distribution and synchronization
- Reactive vs. proactive flow installation

## Applications

- Data center traffic engineering
- WAN optimization and traffic engineering
- 5G core network slicing
- Security policy enforcement`,
  },
  {
    title: 'Randomized Algorithms for Big Data Processing',
    discipline: 'computer-science',
    source: 'paper',
    viewCount: 119,
    metadata: {
      subDiscipline: 'algorithms',
      tags: ['Randomized Algorithm', 'Streaming', 'Sketching', 'Hashing'],
      authors: ['Motwani, R.', 'Vempala, S.'],
      year: 2024,
      abstract: 'A review of randomized algorithms for streaming data processing, including count-min sketches, locality-sensitive hashing, and reservoir sampling.',
    },
    content: `## Streaming Model

Single-pass or few-pass algorithms process data streams with sublinear memory, trading exactness for efficiency.

## Sketching Data Structures

- Count-Min sketch for frequency estimation
- HyperLogLog for cardinality estimation
- AMS sketch for second moment estimation

## Locality-Sensitive Hashing

- MinHash for Jaccard similarity
- SimHash for cosine similarity
- Approximate nearest neighbor search

## Randomized Numerical Linear Algebra

- Random projections and Johnson-Lindenstrauss
- CUR matrix decomposition
- Stochastic gradient descent convergence

## Graph Streaming

- Spanners and sparsifiers
- Connectivity and matching in dynamic graphs
- Triangle counting in adjacency streams`,
  },
  {
    title: 'Byzantine Fault Tolerance in Distributed Systems',
    discipline: 'computer-science',
    source: 'paper',
    viewCount: 145,
    metadata: {
      subDiscipline: 'systems',
      tags: ['Byzantine Fault Tolerance', 'Consensus', 'PBFT', 'Blockchain'],
      authors: ['Castro, M.', 'Liskov, B.'],
      year: 2024,
      abstract: 'A review of Byzantine fault tolerant consensus protocols including PBFT, HotStuff, and their applications in blockchain systems.',
    },
    content: `## Byzantine Fault Model

Byzantine nodes may behave arbitrarily, requiring consensus protocols that tolerate up to f faulty nodes among 3f+1 total.

## Practical Byzantine Fault Tolerance

- PBFT three-phase commit protocol
- View changes and checkpointing
- Quorum certificate collection

## Scalable BFT Protocols

- HotStuff and chained BFT with linear communication
- Tendermint and Casper FFG
- Streamlet and minimal consensus protocols

## Blockchain Consensus

- Proof of work and Nakamoto consensus
- Proof of stake and committee selection
- DAG-based protocols: Narwhal, Aleph, Block-STM

## Formal Verification

- TLA+ specifications of consensus protocols
- Model checking safety and liveness properties
- Automated refinement proofs`,
  },
  {
    title: 'Learned Index Structures for Database Systems',
    discipline: 'computer-science',
    source: 'paper',
    viewCount: 156,
    metadata: {
      subDiscipline: 'databases',
      tags: ['Learned Index', 'Machine Learning', 'B-Tree', 'Range Query'],
      authors: ['Kraska, T.', 'Mitzenmacher, M.'],
      year: 2024,
      abstract: 'A review of learned index structures that replace traditional B-Trees and hash indexes with machine learning models for improved performance.',
    },
    content: `## Learned Index Concept

Neural networks and piecewise linear models learn key distributions, potentially outperforming traditional index structures.

## RMI and Piecewise Models

- Recursive model index with hierarchical experts
- Piecewise linear approximation (PGM index)
- Radix spline and fingerprint indexes

## Handling Updates

- Staged learning with buffer trees
- Online model retraining strategies
- Learned indexes for dynamic workloads

## Multi-Dimensional Extensions

- Learned spatial indexes
- Approximate nearest neighbor learned indexes
- Learned bloom filters and filters in general

## Integration with DBMS

- Cost models combining learned and traditional indexes
- Query optimizer awareness of learned structures
- GPU-accelerated learned index inference`,
  },
  {
    title: 'Formal Verification of Compiler Correctness',
    discipline: 'computer-science',
    source: 'paper',
    viewCount: 87,
    metadata: {
      subDiscipline: 'software-engineering',
      tags: ['Compiler Verification', 'Formal Methods', 'Semantics', 'Coq'],
      authors: ['Leroy, X.', 'Appel, A.W.'],
      year: 2024,
      abstract: 'A review of formally verified compilers, focusing on CompCert and verified compilation of concurrent and optimized code.',
    },
    content: `## Compiler Verification Motivation

Bugs in compilers silently produce incorrect code, making formal verification essential for safety-critical systems.

## CompCert Verified C Compiler

- Small-step operational semantics
- Simulation relations between compiler passes
- Machine-checked Coq proofs

## Verified Optimizations

- Register allocation and liveness analysis
- Loop transformations with polyhedral models
- Dead code elimination and constant propagation

## Concurrent Code Compilation

- Memory model-aware compilation
- Data race freedom preservation
- Relaxed memory semantics verification

## Verified JIT and Dynamic Compilation

- Proof-carrying code frameworks
- Cranelift and WebAssembly verification
- End-to-end verified system stacks`,
  },

  // ==================== ARTIFICIAL INTELLIGENCE ====================
  {
    title: 'Self-Supervised Learning for Computer Vision',
    discipline: 'artificial-intelligence',
    source: 'paper',
    viewCount: 178,
    metadata: {
      subDiscipline: 'computer-vision',
      tags: ['Self-Supervised Learning', 'Contrastive Learning', 'MAE', 'Representation Learning'],
      authors: ['He, K.', 'LeCun, Y.'],
      year: 2024,
      abstract: 'A review of self-supervised visual representation learning, covering contrastive methods, masked autoencoders, and joint embedding architectures.',
    },
    content: `## Self-Supervised Pretraining

Training on unlabeled data with pretext tasks yields visual representations rivaling supervised pretraining.

## Contrastive Learning

- SimCLR and MoCo instance discrimination
- BYOL and SimSiam without negatives
- InfoNCE loss and augmentation strategies

## Masked Image Modeling

- BEiT and MAE with vision transformers
- Reconstruction targets: pixels vs. tokens
- Masking strategies and sampling ratios

## Joint Embedding Architectures

- DINO and self-distillation
- I-JEPA with invariant prediction
- Data2vec unified multimodal framework

## Transfer Performance

- Linear probing and fine-tuning benchmarks
- Semantic segmentation and object detection
- Scaling laws for self-supervised pretraining`,
  },
  {
    title: 'Pretrained Language Models for Low-Resource Languages',
    discipline: 'artificial-intelligence',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'nlp',
      tags: ['Low-Resource NLP', 'Multilingual', 'Transfer Learning', 'BERT'],
      authors: ['Conneau, A.', 'Artetxe, M.'],
      year: 2024,
      abstract: 'A review of approaches to adapt pretrained multilingual models to low-resource languages through continued pretraining and cross-lingual transfer.',
    },
    content: `## Low-Resource NLP Challenges

Insufficient annotated data and limited pretraining corpora hinder NLP development for most of the world's languages.

## Multilingual Pretraining

- mBERT, XLM-R, and mT5 architectures
- Subword segmentation for multilingual vocabularies
- Balanced sampling across language families

## Continued Pretraining

- Domain-adaptive and task-adaptive pretraining
- Vocabulary extension for unseen scripts
- Adapter layers for parameter-efficient adaptation

## Cross-Lingual Transfer

- Zero-shot transfer from high-resource languages
- Translation-based data augmentation
- Pivot languages and multilingual training

## Evaluation and Benchmarks

- XTREME, XTREME-UP, and AmericasNLP
- Language coverage and typological diversity
- Fairness metrics across language groups`,
  },
  {
    title: 'Multi-Agent Reinforcement Learning for Cooperative Games',
    discipline: 'artificial-intelligence',
    source: 'paper',
    viewCount: 156,
    metadata: {
      subDiscipline: 'reinforcement-learning',
      tags: ['Multi-Agent RL', 'Cooperative Game', 'QMIX', 'MADDPG'],
      authors: ['Lowe, R.', 'Foerster, J.'],
      year: 2024,
      abstract: 'A review of multi-agent reinforcement learning algorithms for cooperative settings, including value factorization and communication protocols.',
    },
    content: `## Multi-Agent RL Challenges

Non-stationarity, credit assignment, and exponential action spaces complicate learning in multi-agent systems.

## Value Factorization Methods

- VDN and QMIX monotonic factorization
- QTRAN and QPLEX for non-monotonic cases
- Weighted QMIX for implicit credit assignment

## Policy Gradient Approaches

- MADDPG with centralized training
- MAPPO for large-scale cooperative tasks
- Heterogeneous agent architectures

## Communication Learning

- Differentiable inter-agent communication
- Emergent communication protocols
- Graph neural networks for message passing

## Applications

- Autonomous vehicle coordination
- Smart grid demand response
- Multi-robot warehouse logistics
- StarCraft and Dota 2 game AI`,
  },

  // ==================== MEDICINE ====================
  {
    title: 'Fragment-Based Drug Discovery and Lead Optimization',
    discipline: 'medicine',
    source: 'publication',
    viewCount: 112,
    metadata: {
      subDiscipline: 'drug-discovery',
      tags: ['Fragment-Based', 'Drug Discovery', 'Lead Optimization', 'SBDD'],
      authors: ['Blundell, T.L.', 'Hubbard, R.E.'],
      year: 2024,
      abstract: 'A review of fragment-based drug discovery methods using biophysical screening and structure-guided optimization to develop clinical candidates.',
    },
    content: `## Fragment-Based Approach

Low molecular weight fragments (MW < 300) bind with weak affinity but high ligand efficiency, enabling efficient exploration of chemical space.

## Fragment Screening Methods

- X-ray crystallography and NMR fragment screening
- Surface plasmon resonance and thermal shift assays
- Mass spectrometry-based binding assays

## Hit-to-Lead Strategies

- Fragment growing and linking
- Structure-based design cycles
- Biochemical and cellular assay cascades

## Computational Methods

- Fragment docking and scoring
- Free energy perturbation calculations
- De novo fragment-based design

## Success Stories

- BRAF and EGFR kinase inhibitors
- Bromodomain-targeting compounds
- SARS-CoV-2 main protease inhibitors`,
  },
  {
    title: 'Federated Learning for Multi-Site Medical Imaging',
    discipline: 'medicine',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'medical-imaging',
      tags: ['Federated Learning', 'Medical Imaging', 'Privacy', 'Deep Learning'],
      authors: ['Dayan, I.', 'Flores, M.'],
      year: 2024,
      abstract: 'A review of federated learning approaches for training deep learning models on distributed medical imaging data without centralizing patient information.',
    },
    content: `## Federated Learning Basics

Model parameters are aggregated across institutions while raw data remains local, preserving patient privacy.

## Aggregation Strategies

- Federated averaging and weighted averaging
- Secure aggregation with homomorphic encryption
- Differential privacy for parameter updates

## Heterogeneity Challenges

- Statistical heterogeneity across sites
- System heterogeneity in compute resources
- Personalized federated learning approaches

## Medical Imaging Applications

- Brain tumor segmentation (BraTS)
- COVID-19 lesion detection in chest CT
- Diabetic retinopathy grading

## Regulatory and Practical Considerations

- HIPAA and GDPR compliance
- Model ownership and intellectual property
- Clinical validation across diverse populations`,
  },
  {
    title: 'CAR-T Cell Therapy for Solid Tumors: Challenges and Strategies',
    discipline: 'medicine',
    source: 'publication',
    viewCount: 156,
    metadata: {
      subDiscipline: 'clinical-medicine',
      tags: ['CAR-T', 'Immunotherapy', 'Solid Tumor', 'T Cell Engineering'],
      authors: ['June, C.H.', 'Sadelain, M.'],
      year: 2024,
      abstract: 'A review of CAR-T cell therapy challenges in solid tumors and engineering strategies to overcome tumor heterogeneity and immunosuppression.',
    },
    content: `## CAR-T Cell Fundamentals

Chimeric antigen receptor T cells are engineered to recognize tumor antigens, showing remarkable efficacy in hematological malignancies.

## Solid Tumor Barriers

- Lack of unique tumor-specific antigens
- Physical barriers: stroma and extracellular matrix
- Immunosuppressive tumor microenvironment

## Next-Generation CAR Designs

- Armored CARs with cytokine secretion
- Switch receptor and logic-gate CARs
- CAR-T with checkpoint blockade integration

## Target Selection

- Tumor-associated antigens vs. tumor-specific antigens
- GD2, HER2, and EGFRvIII targets
- Intracellular antigen targeting via TCR-CAR hybrids

## Manufacturing and Delivery

- Allogeneic off-the-shelf CAR-T cells
- In vivo CAR-T generation with mRNA
- Regional vs. systemic delivery routes`,
  },
  {
    title: 'Wearable Biosensors for Continuous Metabolite Monitoring',
    discipline: 'medicine',
    source: 'paper',
    viewCount: 98,
    metadata: {
      subDiscipline: 'biomedical',
      tags: ['Wearable Biosensor', 'Continuous Monitoring', 'Glucose', 'Sweat Analysis'],
      authors: ['Wang, J.', 'Gao, W.'],
      year: 2024,
      abstract: 'A review of wearable electrochemical and optical biosensors for non-invasive continuous monitoring of metabolites in sweat and interstitial fluid.',
    },
    content: `## Wearable Biosensing Motivation

Continuous monitoring of metabolites enables personalized health management and early disease detection outside clinical settings.

## Electrochemical Sensors

- Enzymatic glucose sensors with glucose oxidase
- Non-enzymatic direct electrocatalysis
- Ion-selective electrodes for electrolytes

## Interstitial Fluid Access

- Microneedle arrays for minimally invasive sampling
- Reverse iontophoresis extraction
- Correlation with blood glucose levels

## Sweat-Based Monitoring

- Sweat induction and collection systems
- Multiplexed metabolite and electrolyte panels
- Temperature and pH compensation

## System Integration

- Flexible printed circuit board designs
- Bluetooth Low Energy data transmission
- Machine learning for calibration and drift correction`,
  },

  // ==================== ECONOMICS ====================
  {
    title: 'High-Frequency Trading and Market Microstructure',
    discipline: 'economics',
    source: 'paper',
    viewCount: 112,
    metadata: {
      subDiscipline: 'financial-engineering',
      tags: ['High-Frequency Trading', 'Market Microstructure', 'Limit Order Book', 'Latency'],
      authors: ['Hasbrouck, J.', "O'Hara, M."],
      year: 2024,
      abstract: 'A review of high-frequency trading strategies, limit order book dynamics, and the impact of latency on market quality and liquidity.',
    },
    content: `## Market Microstructure Foundations

Trading mechanisms and participant behavior at short time scales determine price discovery, liquidity, and market quality.

## Limit Order Book Dynamics

- Bid-ask spread and order book depth
- Queue position and priority rules
- Order flow toxicity and VPIN metric

## High-Frequency Strategies

- Market making and spread capture
- Statistical arbitrage across venues
- Latency arbitrage and sniping

## Latency and Infrastructure

- Co-location and proximity hosting
- Microwave and laser links between venues
- FPGA-based trading system acceleration

## Regulatory Responses

- Circuit breakers and trading halts
- Minimum resting times for orders
- Transaction taxes and fee structures`,
  },
  {
    title: 'Natural Experiments in Causal Policy Evaluation',
    discipline: 'economics',
    source: 'paper',
    viewCount: 87,
    metadata: {
      subDiscipline: 'econometrics',
      tags: ['Natural Experiment', 'Causal Inference', 'Policy Evaluation', 'RDD'],
      authors: ['Angrist, J.D.', 'Pischke, J.S.'],
      year: 2024,
      abstract: 'A review of natural experiment methods including regression discontinuity and difference-in-differences for evaluating causal policy effects.',
    },
    content: `## Natural Experiment Framework

Exogenous variation from institutional features or quasi-random assignments enables causal inference without controlled experiments.

## Regression Discontinuity

- Sharp and fuzzy RDD designs
- Bandwidth selection and local polynomial estimation
- Density continuity tests for manipulation

## Difference-in-Differences

- Parallel trends assumption and testing
- Staggered adoption and heterogeneous effects
- Synthetic control methods

## Instrumental Variables in Practice

- Relevance and exclusion restriction validation
- Weak instrument diagnostics
- Local interpretation of IV estimates

## Policy Applications

- Minimum wage employment effects
- Educational interventions and test scores
- Healthcare policy and patient outcomes`,
  },
  {
    title: 'Auction Theory and Mechanism Design for Online Markets',
    discipline: 'economics',
    source: 'paper',
    viewCount: 94,
    metadata: {
      subDiscipline: 'microeconomics',
      tags: ['Auction Theory', 'Mechanism Design', 'Online Advertising', 'VCG'],
      authors: ['Milgrom, P.', 'Segal, I.'],
      year: 2024,
      abstract: 'A review of auction theory and mechanism design principles applied to online advertising markets and spectrum allocation.',
    },
    content: `## Auction Formats

First-price, second-price, and combinatorial auctions allocate resources efficiently while maximizing seller revenue.

## Online Advertising Auctions

- Generalized second-price and VCG mechanisms
- Quality score and click-through rate estimation
- Reserve price optimization

## Spectrum Auctions

- Simultaneous multi-round ascending auctions
- Package bidding and winner determination
- Incentive auction designs for repurposing

## Mechanism Design Theory

- Revelation principle and incentive compatibility
- Myerson optimal auction characterization
- Approximation mechanisms for complexity

## Behavioral and Practical Considerations

- Bid shading in first-price auctions
- Collusion and signaling in repeated auctions
- Transparency and fairness in algorithmic allocation`,
  },
  {
    title: 'Climate Change Economics and Carbon Pricing Mechanisms',
    discipline: 'economics',
    source: 'paper',
    viewCount: 103,
    metadata: {
      subDiscipline: 'macroeconomics',
      tags: ['Climate Economics', 'Carbon Pricing', 'Carbon Tax', 'Emissions Trading'],
      authors: ['Nordhaus, W.D.', 'Stern, N.'],
      year: 2024,
      abstract: 'A review of economic approaches to climate change mitigation, comparing carbon taxes, cap-and-trade systems, and integrated assessment models.',
    },
    content: `## Climate Economics Fundamentals

Economic analysis of climate policy requires integrating geophysical constraints with welfare economics and growth theory.

## Carbon Pricing Instruments

- Carbon taxes: price certainty, quantity uncertainty
- Cap-and-trade: quantity certainty, price volatility
- Hybrid systems with price floors and ceilings

## Integrated Assessment Models

- DICE and Nordhaus welfare optimization
- PAGE and Stern Review damages
- IAM uncertainties and tipping points

## Distributional Effects

- Regressive impacts of energy price increases
- Revenue recycling through dividends or tax cuts
- Border carbon adjustments and competitiveness

## International Cooperation

- Paris Agreement NDC architecture
- Climate clubs and carbon border adjustments
- Technology transfer and climate finance`,
  },

  // ==================== SOCIAL SCIENCES ====================
  {
    title: 'Working Memory Capacity and Cognitive Control in Decision Making',
    discipline: 'social-sciences',
    source: 'paper',
    viewCount: 98,
    metadata: {
      subDiscipline: 'psychology',
      tags: ['Working Memory', 'Cognitive Control', 'Decision Making', 'Executive Function'],
      authors: ['Baddeley, A.D.', 'Miyake, A.'],
      year: 2024,
      abstract: 'A review of working memory capacity as a constraint on reasoning, decision making, and executive control in complex cognitive tasks.',
    },
    content: `## Working Memory Architecture

The multicomponent model includes phonological loop, visuospatial sketchpad, episodic buffer, and central executive.

## Capacity Limits

- Cowan's magical number 4 +/- 1 chunks
- Interference and decay in short-term storage
- Individual differences and fluid intelligence

## Cognitive Control Functions

- Inhibition of prepotent responses
- Task switching and mental set shifting
- Dual-task coordination and load effects

## Decision Making Interactions

- Working memory load and delay discounting
- Heuristic vs. analytic processing trade-offs
- Depletion and ego resource models

## Neural Basis

- Prefrontal cortex and basal ganglia circuits
- Dopamine modulation of working memory
- Training and plasticity of capacity limits`,
  },
  {
    title: 'Open Science Practices and Research Transparency',
    discipline: 'social-sciences',
    source: 'publication',
    viewCount: 87,
    metadata: {
      subDiscipline: 'academic-writing',
      tags: ['Open Science', 'Research Transparency', 'Preregistration', 'Replication'],
      authors: ['Nosek, B.A.', 'Munafo, M.R.'],
      year: 2024,
      abstract: 'A review of open science movement practices including preregistration, open data, and replication studies to improve research credibility.',
    },
    content: `## Open Science Movement

Systematic reforms aim to increase transparency, reproducibility, and cumulative knowledge building across disciplines.

## Preregistration

- Hypothesis and analysis plan registration
- Distinguishing confirmatory from exploratory research
- Registered reports in journal peer review

## Open Data and Materials

- FAIR principles for data sharing
- Repository standards and persistent identifiers
- Privacy and ethical considerations

## Replication and Reproducibility

- Direct and conceptual replication designs
- Many Labs and large-scale replication projects
- Statistical power and publication bias

## Incentive Structures

- Open science badges and journal policies
- Funder and institutional mandates
- Career incentives and evaluation reform`,
  },
  {
    title: 'Network Analysis of Scientific Collaboration Patterns',
    discipline: 'social-sciences',
    source: 'paper',
    viewCount: 76,
    metadata: {
      subDiscipline: 'sociology',
      tags: ['Scientific Collaboration', 'Coauthorship Network', 'Bibliometrics', 'Network Analysis'],
      authors: ['Newman, M.E.J.', 'Barabasi, A.L.'],
      year: 2024,
      abstract: 'A review of coauthorship network analysis revealing patterns of scientific collaboration, citation dynamics, and knowledge diffusion.',
    },
    content: `## Coauthorship Networks

Scientific collaboration patterns can be modeled as graphs where nodes are researchers and edges represent joint publications.

## Network Properties

- Small-world and scale-free characteristics
- Community detection for research fields
- Assortative mixing by institution and country

## Collaboration Metrics

- h-index and alternative citation measures
- Betweenness centrality and brokerage roles
- Team size trends and impact correlation

## Temporal Dynamics

- Network growth and preferential attachment
- Career trajectory and collaboration evolution
- Disruption vs. consolidation in science

## Interdisciplinary Patterns

- Cross-field collaboration barriers
- Bridge institutions and knowledge brokers
- Funding and policy implications`,
  },
  {
    title: 'Active Learning Strategies in STEM Higher Education',
    discipline: 'social-sciences',
    source: 'publication',
    viewCount: 82,
    metadata: {
      subDiscipline: 'education',
      tags: ['Active Learning', 'STEM Education', 'Flipped Classroom', 'Peer Instruction'],
      authors: ['Freeman, S.', 'Wieman, C.'],
      year: 2024,
      abstract: 'A review of active learning pedagogies in STEM education, demonstrating improved conceptual understanding and reduced achievement gaps.',
    },
    content: `## Active Learning Principles

Instructional methods engaging students in doing and thinking about content outperform traditional lecture on conceptual measures.

## Evidence Base

- Freeman meta-analysis of 225 STEM studies
- Concept inventory normalized gain comparisons
- Failure rate reduction under active learning

## Specific Techniques

- Peer instruction with clickers
- Flipped classroom with pre-class videos
- Problem-based and project-based learning

## Implementation Challenges

- Faculty development and institutional support
- Classroom design for group work
- Coverage concerns and time management

## Equity and Access

- Reduction of achievement gaps by demographic
- Inclusive teaching practices
- Scaling active learning to large enrollment courses`,
  },

  // ==================== EARTH SCIENCES ====================
  {
    title: 'Remote Sensing of Vegetation Health with Satellite Imagery',
    discipline: 'earth-sciences',
    source: 'paper',
    viewCount: 91,
    metadata: {
      subDiscipline: 'environmental',
      tags: ['Remote Sensing', 'NDVI', 'Vegetation Health', 'Satellite'],
      authors: ['Myneni, R.B.', 'Sellers, P.J.'],
      year: 2024,
      abstract: 'A review of satellite remote sensing methods for monitoring vegetation health using spectral vegetation indices and hyperspectral data.',
    },
    content: `## Spectral Vegetation Indices

Vegetation spectral signatures in red and near-infrared bands enable quantification of photosynthetic activity and biomass.

## Key Indices

- NDVI: normalized difference vegetation index
- EVI and SAVI: enhanced vegetation indices
- Chlorophyll fluorescence as direct photosynthesis proxy

## Satellite Platforms

- MODIS and VIIRS for global monitoring
- Landsat for medium-resolution time series
- Sentinel-2 for high-resolution agriculture

## Applications

- Drought monitoring and early warning
- Crop yield prediction and insurance
- Forest disturbance and recovery tracking
- Carbon cycle and climate feedbacks

## Machine Learning Integration

- Deep learning for land cover classification
- Data fusion across satellite sensors
- Near-real-time monitoring pipelines`,
  },
  {
    title: 'Marine Heatwaves and Ecosystem Impacts in a Changing Climate',
    discipline: 'earth-sciences',
    source: 'paper',
    viewCount: 87,
    metadata: {
      subDiscipline: 'oceanography',
      tags: ['Marine Heatwave', 'Ocean Warming', 'Coral Bleaching', 'Ecosystem'],
      authors: ['Hobday, A.J.', 'Oliver, E.C.J.'],
      year: 2024,
      abstract: 'A review of marine heatwave events, their detection, physical drivers, and ecological impacts on marine ecosystems and fisheries.',
    },
    content: `## Marine Heatwave Definition

Prolonged anomalously warm ocean temperatures have devastating impacts on marine ecosystems and coastal economies.

## Detection Methods

- Percentile-based thresholds (Hobday definition)
- Relative vs. absolute temperature anomalies
- Duration, intensity, and rate of onset metrics

## Physical Drivers

- Ocean-atmosphere teleconnections (ENSO, IOD)
- Mesoscale eddy heat transport
- Reduced vertical mixing and mixed layer deepening

## Ecological Impacts

- Coral bleaching and reef degradation
- Kelp forest collapse and range shifts
- Fisheries stock redistribution

## Future Projections

- Increasing frequency under climate change
- Compound events with acidification and hypoxia
- Adaptation strategies for marine management`,
  },
  {
    title: 'Seismic Waveform Inversion for Subsurface Imaging',
    discipline: 'earth-sciences',
    source: 'paper',
    viewCount: 76,
    metadata: {
      subDiscipline: 'geology',
      tags: ['Seismic Inversion', 'Waveform', 'Subsurface Imaging', 'Full Waveform'],
      authors: ['Virieux, J.', 'Operto, S.'],
      year: 2024,
      abstract: 'A review of full-waveform inversion methods for high-resolution subsurface imaging using seismic data and numerical wave propagation.',
    },
    content: `## Full-Waveform Inversion

FWI iteratively minimizes differences between observed and modeled seismic waveforms to estimate subsurface velocity models.

## Forward Modeling

- Finite-difference and finite-element methods
- Spectral element methods for complex geometry
- Time-domain vs. frequency-domain approaches

## Optimization Strategies

- Gradient-based methods: L-BFGS, truncated Newton
- Multi-scale inversion from low to high frequencies
- Source encoding and stochastic gradients

## Ill-Posedness and Regularization

- Cycle skipping and local minima
- Total variation and Tikhonov regularization
- Hybridization with traveltime tomography

## Applications

- Oil and gas reservoir characterization
- CO2 sequestration monitoring
- Near-surface engineering geophysics
- Crustal-scale lithospheric imaging`,
  },
  {
    title: 'Atmospheric Aerosols, Clouds, and Climate Forcing',
    discipline: 'earth-sciences',
    source: 'paper',
    viewCount: 98,
    metadata: {
      subDiscipline: 'atmospheric',
      tags: ['Aerosol', 'Cloud', 'Climate Forcing', 'Radiation'],
      authors: ['Seinfeld, J.H.', 'Ramanathan, V.'],
      year: 2024,
      abstract: 'A review of atmospheric aerosol effects on clouds and climate, covering direct radiative forcing and indirect cloud albedo effects.',
    },
    content: `## Aerosol-Climate Interactions

Atmospheric aerosols scatter and absorb radiation and modify cloud properties, representing the largest uncertainty in climate forcing.

## Direct Radiative Forcing

- Scattering vs. absorbing aerosol types
- sulfate, black carbon, and mineral dust
- Aerosol optical depth and radiative efficiency

## Indirect Cloud Effects

- Cloud condensation nuclei activation
- Twomey effect on cloud albedo
- Lifetime effect and precipitation suppression

## Aerosol Sources and Processing

- Primary emissions and secondary formation
- Chemical aging and hygroscopic growth
- Long-range transport and deposition

## Observations and Models

- AERONET and satellite aerosol retrievals
- Cloud-aerosol interaction parameterizations
- Aerosol forcing in CMIP6 models`,
  },

  // ==================== INTERDISCIPLINARY ====================
  {
    title: 'Quantum Error Correction with Surface Codes',
    discipline: 'interdisciplinary',
    source: 'paper',
    viewCount: 145,
    metadata: {
      subDiscipline: 'computational-physics',
      tags: ['Quantum Error Correction', 'Surface Code', 'Fault Tolerance', 'Stabilizer'],
      authors: ['Fowler, A.G.', 'Martinis, J.M.'],
      year: 2024,
      abstract: 'A review of surface code quantum error correction, covering stabilizer measurements, decoding algorithms, and fault-tolerant threshold estimates.',
    },
    content: `## Quantum Error Correction Basics

Quantum information is protected by encoding logical qubits into entangled states of many physical qubits.

## Surface Code

- Planar and toric code geometries
- X and Z stabilizer measurements
- Code distance and error suppression

## Decoding Algorithms

- Minimum weight perfect matching
- Union-find decoder
- Neural network and belief propagation decoders

## Fault-Tolerant Gates

- Lattice surgery and braiding
- Magic state distillation
- Transversal and non-transversal operations

## Experimental Progress

- Google Sycamore distance-5 surface code
- Logical error rate below physical error rate
- Roadmap to practical quantum computing`,
  },
  {
    title: 'Metagenomic Assembly and Functional Annotation Pipelines',
    discipline: 'interdisciplinary',
    source: 'paper',
    viewCount: 112,
    metadata: {
      subDiscipline: 'bioinformatics',
      tags: ['Metagenomics', 'Assembly', 'Functional Annotation', 'Microbiome'],
      authors: ['Quince, C.', 'Segata, N.'],
      year: 2024,
      abstract: 'A review of computational pipelines for metagenomic sequence assembly, binning, and functional annotation of microbial community genomes.',
    },
    content: `## Metagenomic Analysis Workflow

Shotgun sequencing of environmental DNA requires specialized computational methods for assembly and community characterization.

## Assembly Strategies

- Co-assembly vs. individual sample assembly
- De Bruijn graph approaches for mixed communities
- Long-read metagenome assembly with HiFi

## Genome Binning

- Composition-based and coverage-based binning
- CheckM for completeness and contamination
- Dereplication and quality filtering

## Functional Annotation

- Gene calling and ORF prediction
- KEGG, COG, and CAZy database mapping
- Antibiotic resistance gene identification

## Downstream Analysis

- Alpha and beta diversity metrics
- Differential abundance testing
- Strain-level tracking across samples`,
  },
  {
    title: 'Co-Packaged Optics for AI Data Center Interconnects',
    discipline: 'interdisciplinary',
    source: 'paper',
    viewCount: 134,
    metadata: {
      subDiscipline: 'optoelectronic-integration',
      tags: ['Co-Packaged Optics', 'Data Center', 'AI Interconnect', 'Silicon Photonics'],
      authors: ['Stojanovic, V.', 'Atabaki, A.'],
      year: 2024,
      abstract: 'A review of co-packaged optical interconnects for AI training clusters, addressing bandwidth density and energy efficiency requirements.',
    },
    content: `## AI Cluster Interconnect Demands

Training large AI models requires terabit-scale chip-to-chip communication with minimal energy per bit.

## Co-Packaged Optics Architecture

- Optical I/O chiplets adjacent to ASICs
- 2.5D interposer and 3D stacking
- Electrical vs. optical reach trade-offs

## Silicon Photonic Transceivers

- Microring and Mach-Zehnder modulator arrays
- Integrated lasers vs. external laser sources
- 112 Gbps/lane and beyond signaling

## Standards and Ecosystem

- CPO standardization efforts
- Pluggable vs. on-board vs. co-packaged evolution
- Reliability and repairability concerns

## Future Directions

- Optical circuit switching for reconfigurable topologies
- In-package optical interconnect meshes
- Co-packaged optics for memory disaggregation`,
  },
  {
    title: 'Convergence Research: Integrating Physical and Life Sciences',
    discipline: 'interdisciplinary',
    source: 'publication',
    viewCount: 67,
    metadata: {
      subDiscipline: 'multi-disciplinary',
      tags: ['Convergence Research', 'Interdisciplinary', 'Team Science', 'Translation'],
      authors: ['Sharp, P.A.', 'Langer, R.'],
      year: 2024,
      abstract: 'A review of convergence research approaches that integrate physical, engineering, and life sciences for transformative biomedical innovations.',
    },
    content: `## Convergence Research Concept

Deep integration across disciplines accelerates discovery at the intersection of physical sciences, engineering, and biology.

## Organizational Models

- Interdisciplinary research centers and institutes
- Shared facilities and core laboratories
- Funding mechanisms for team science

## Training and Education

- Dual-degree and certificate programs
- Lab rotations across disciplinary boundaries
- Communication skills for cross-cultural collaboration

## Success Examples

- Bioengineering and medical devices
- Nanotechnology for drug delivery
- Genomics and data science integration
- Quantum biology and photosynthesis

## Challenges and Metrics

- Peer review across disciplines
- Tenure and promotion for interdisciplinary work
- Measuring impact beyond traditional citation metrics`,
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

  console.log(`Padding complete! Created: ${created}, Skipped: ${skipped}`)

  // Summary
  const summary = await prisma.knowledgeDocument.groupBy({
    by: ['discipline'],
    _count: { id: true },
  })
  console.log('\nDiscipline counts after padding:')
  for (const row of summary) {
    console.log(`  ${row.discipline}: ${row._count.id}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
