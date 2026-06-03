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

const DOCUMENTS: SeedDoc[] = [
  // ==================== PHYSICS (+4) ====================
  {
    title: 'Quantum Field Theory and the Standard Model of Particle Physics',
    content: `## Overview\n\nQuantum Field Theory (QFT) is the theoretical framework that combines quantum mechanics with special relativity, forming the foundation of modern particle physics.\n\n## The Standard Model\n\nThe Standard Model describes three of the four fundamental forces:\n- **Electromagnetic**: Mediated by photons\n- **Weak**: Mediated by W and Z bosons\n- **Strong**: Mediated by gluons\n\n### Matter Particles\n- **Quarks**: Up, Down, Charm, Strange, Top, Bottom\n- **Leptons**: Electron, Muon, Tau, and their neutrinos\n\n### Force Carriers\n- Photon (electromagnetism)\n- W+/W-/Z bosons (weak force)\n- Gluons (strong force, 8 color states)\n\n## Feynman Diagrams\n\nFeynman diagrams provide a pictorial representation of particle interactions and scattering amplitudes.\n\n## Beyond the Standard Model\n\n- **Supersymmetry**: Partners for every known particle\n- **Grand Unification**: Unifying forces at high energy\n- **String Theory**: Fundamental strings instead of point particles`,
    source: 'wiki',
    discipline: 'physics',
    viewCount: 201,
    metadata: { subDiscipline: 'theoretical-physics', tags: ['Theoretical Derivation', 'Quantum Field Theory', 'Standard Model', 'Particle Physics'], authors: ['Peskin, M.E.', 'Schroeder, D.V.'], year: 2024, abstract: "An introduction to Quantum Field Theory and the Standard Model, covering fundamental forces, matter particles, and beyond-the-Standard-Model physics." },
  },
  {
    title: 'Superconductivity and Superfluidity in Condensed Matter Systems',
    content: `## Macroscopic Quantum Phenomena\n\nSuperconductivity and superfluidity represent remarkable macroscopic manifestations of quantum mechanics.\n\n## BCS Theory of Superconductivity\n\n### Cooper Pairs\n- Two electrons form a bound state via phonon-mediated attraction\n- Total spin S=0 (singlet state)\n- All pairs occupy the same quantum state\n\n### Energy Gap\n- 2*Delta(T) gap in the excitation spectrum\n- Zero DC resistance below Tc\n- Perfect diamagnetism (Meissner effect)\n\n## Unconventional Superconductors\n\n- **High-Tc cuprates**: d-wave symmetry, Tc up to 138K\n- **Iron-based superconductors**: Multi-band superconductivity\n- **Heavy fermion systems**: f-electron mediated pairing\n\n## Superfluid Helium\n\n- **He-4**: Bose-Einstein condensation of bosons\n- **He-3**: p-wave pairing of fermions, analogous to BCS\n\n## Applications\n\n- MRI magnets (Nb-Ti, Nb3Sn)\n- SQUID magnetometers\n- Quantum computing (transmon qubits)`,
    source: 'publication',
    discipline: 'physics',
    viewCount: 156,
    metadata: { subDiscipline: 'condensed-matter', tags: ['Superconductivity', 'Condensed Matter', 'BCS Theory', 'Cooper Pairs'], authors: ['Tinkham, M.', 'Bardeen, J.'], year: 2024, abstract: "A review of superconductivity and superfluidity, covering BCS theory, unconventional superconductors, and applications." },
  },
  {
    title: 'Atomic and Molecular Spectroscopy: Principles and Applications',
    content: `## Spectroscopic Techniques\n\nSpectroscopy studies the interaction between matter and electromagnetic radiation, providing fingerprints of atomic and molecular structure.\n\n## Electronic Spectroscopy\n\n### UV-Vis Absorption\n- Electronic transitions between orbitals\n- Beer-Lambert law for quantitative analysis\n\n### Fluorescence and Phosphorescence\n- Singlet and triplet states\n- Jablonski diagram\n\n## Vibrational Spectroscopy\n\n### Infrared (IR)\n- Dipole moment change required\n- Characteristic group frequencies\n\n### Raman Spectroscopy\n- Polarizability change required\n- Complementary to IR\n\n## Rotational Spectroscopy\n\n- Microwave spectroscopy\n- Rotational constants and bond lengths\n\n## Applications\n\n- **Astronomy**: Stellar composition, redshift measurement\n- **Analytical chemistry**: Identification and quantification\n- **Medical diagnostics**: MRI, NMR spectroscopy\n- **Environmental monitoring**: Remote sensing of pollutants`,
    source: 'wiki',
    discipline: 'physics',
    viewCount: 132,
    metadata: { subDiscipline: 'atomic-molecular', tags: ['Spectroscopy', 'Atomic Physics', 'Molecular Physics', 'Quantum Mechanics'], authors: ['Herzberg, G.', 'Bernath, P.F.'], year: 2024, abstract: "An overview of atomic and molecular spectroscopy techniques and their applications across science and technology." },
  },
  {
    title: 'Computational Methods in Quantum Many-Body Physics',
    content: `## The Many-Body Problem\n\nQuantum many-body systems with strong correlations defy analytical solutions, requiring sophisticated numerical methods.\n\n## Exact Diagonalization\n\n- Direct solution of the Hamiltonian matrix\n- Limited to ~20-40 sites due to exponential growth\n- Lanczos algorithm for ground state\n\n## Quantum Monte Carlo\n\n### Variational Monte Carlo\n- Trial wavefunction optimization\n- Jastrow factors for correlations\n\n### Diffusion Monte Carlo\n- Projective method for ground state\n- Fixed-node approximation for fermions\n\n## Tensor Network Methods\n\n### Matrix Product States (MPS/DMRG)\n- Efficient representation of 1D gapped systems\n- Density Matrix Renormalization Group\n\n### Projected Entangled Pair States (PEPS)\n- Extension to 2D systems\n\n## Quantum Computing Approaches\n\n- Variational Quantum Eigensolver (VQE)\n- Quantum Approximate Optimization Algorithm (QAOA)`,
    source: 'paper',
    discipline: 'physics',
    viewCount: 118,
    metadata: { subDiscipline: 'computational-physics', tags: ['Computational Physics', 'Quantum Many-Body', 'Tensor Networks', 'Monte Carlo'], authors: ['White, S.R.', 'Schollwock, U.'], year: 2024, abstract: "A review of computational methods for quantum many-body physics, covering exact diagonalization, QMC, and tensor network methods." },
  },

  // ==================== OPTICS (+3) ====================
  {
    title: 'Fourier Optics and Optical Information Processing',
    content: `## Foundations of Fourier Optics\n\nFourier optics treats light propagation through linear systems using Fourier analysis, providing a powerful framework for understanding diffraction and imaging.\n\n## Scalar Diffraction Theory\n\n### Fresnel Diffraction\n- Paraxial approximation\n- Quadratic phase factor\n\n### Fraunhofer Diffraction\n- Far-field limit\n- Fourier transform of aperture function\n\n## Lens as a Fourier Transformer\n\nA thin lens performs a 2D Fourier transform between its focal planes:\n- Object plane → Fourier plane (back focal plane)\n- Frequency spectrum directly observable\n\n## Optical Information Processing\n\n### 4f Optical Correlator\n- Two lenses with Fourier plane filtering\n- Spatial filtering and pattern recognition\n\n### Holography\n- Gabor in-line holography\n- Leith-Upatnieks off-axis holography\n- Digital holography and phase retrieval\n\n## Modern Applications\n\n- Phase-contrast microscopy\n- Optical computing\n- Fourier ptychography\n- Structured illumination microscopy`,
    source: 'publication',
    discipline: 'optics',
    viewCount: 145,
    metadata: { subDiscipline: 'physical-optics', tags: ['Fourier Optics', 'Diffraction', 'Holography', 'Optical Computing'], authors: ['Goodman, J.W.', 'Gaskill, J.D.'], year: 2024, abstract: "An introduction to Fourier optics and optical information processing, covering scalar diffraction theory and modern applications." },
  },
  {
    title: 'Adaptive Optics for Astronomical Telescopes and Retinal Imaging',
    content: `## Wavefront Sensing and Correction\n\nAdaptive optics (AO) compensates for optical aberrations in real time, enabling diffraction-limited imaging through turbulent media.\n\n## Wavefront Sensors\n\n### Shack-Hartmann Sensor\n- Microlens array divides pupil\n- Spot displacement measures local wavefront slope\n\n### Pyramid Wavefront Sensor\n- Higher sensitivity than Shack-Hartmann\n- Used in extreme AO systems\n\n## Wavefront Correctors\n\n### Deformable Mirrors\n- Piezoelectric or MEMS actuators\n- Stroke and actuator density trade-offs\n\n### Liquid Crystal Spatial Light Modulators\n- Pixelated phase control\n- High spatial resolution\n\n## Astronomical AO\n\n- **Natural Guide Star (NGS) AO**: Uses bright reference star\n- **Laser Guide Star (LGS) AO**: Creates artificial star with sodium laser\n- **Multi-Conjugate AO (MCAO)**: Multiple DM layers for wide field\n\n## Ophthalmic AO\n\n- Cellular-resolution retinal imaging\n- Photoreceptor mosaic mapping\n- Early disease detection`,
    source: 'publication',
    discipline: 'optics',
    viewCount: 167,
    metadata: { subDiscipline: 'geometric-optics', tags: ['Adaptive Optics', 'Wavefront Sensing', 'Astronomy', 'Retinal Imaging'], authors: ['Tyson, R.K.', 'Roddier, F.'], year: 2024, abstract: "A review of adaptive optics technology for astronomical telescopes and retinal imaging, covering wavefront sensors and correctors." },
  },
  {
    title: 'Nonlinear Optical Phenomena in Ultrafast Pulse Propagation',
    content: `## Nonlinear Optics Fundamentals\n\nNonlinear optics describes light-matter interactions where the optical response depends on the light intensity itself.\n\n## Key Nonlinear Effects\n\n### Kerr Effect\n- Intensity-dependent refractive index: n = n0 + n2*I\n- Self-focusing and self-phase modulation\n- Temporal and spatial solitons\n\n### Second-Harmonic Generation\n- Chi^(2) nonlinearity\n- Phase matching conditions\n\n### Four-Wave Mixing\n- Third-order nonlinear process\n- Parametric amplification and oscillation\n\n## Ultrafast Pulse Dynamics\n\n### Dispersion Management\n- Group velocity dispersion (GVD)\n- Dispersion compensation with gratings and prisms\n\n### Supercontinuum Generation\n- Spectral broadening in nonlinear fibers\n- Applications in frequency metrology\n\n## Applications\n\n- Optical parametric amplifiers (OPA)\n- Terahertz generation\n- Frequency comb stabilization\n- Attosecond pulse generation`,
    source: 'paper',
    discipline: 'optics',
    viewCount: 134,
    metadata: { subDiscipline: 'nonlinear-optics', tags: ['Nonlinear Optics', 'Ultrafast Optics', 'Kerr Effect', 'Solitons'], authors: ['Boyd, R.W.', 'Agrawal, G.P.'], year: 2024, abstract: "A review of nonlinear optical phenomena in ultrafast pulse propagation, covering Kerr effects, dispersion management, and applications." },
  },

  // ==================== PHOTONICS (+4) ====================
  {
    title: 'Photonic Crystal Fibers: Design and Applications',
    content: `## Microstructured Optical Fibers\n\nPhotonic crystal fibers (PCFs) use a periodic array of air holes to guide light, enabling properties unattainable in conventional fibers.\n\n## Guiding Mechanisms\n\n### Index-Guiding PCFs\n- Modified total internal reflection\n- Endlessly single-mode operation\n- Large mode area for high-power delivery\n\n### Photonic Bandgap Fibers\n- Hollow-core guidance\n- Low nonlinearity and dispersion\n- Gas-filled applications\n\n## Key Properties\n\n- **Tailorable dispersion**: Zero-dispersion wavelength tuning\n- **High nonlinearity**: Small core PCFs for supercontinuum\n- **Birefringence**: Elliptical cores or asymmetric structures\n\n## Applications\n\n- Supercontinuum generation\n- Soliton compression\n- Gas-based nonlinear optics\n- Sensing (evanescent field interaction)\n- Medical laser delivery`,
    source: 'publication',
    discipline: 'photonics',
    viewCount: 156,
    metadata: { subDiscipline: 'fiber-photonics', tags: ['Photonic Crystal Fiber', 'Microstructured Fiber', 'Supercontinuum', 'Optical Fiber'], authors: ['Russell, P.St.J.', 'Knight, J.C.'], year: 2024, abstract: "A review of photonic crystal fiber design, guiding mechanisms, and applications in nonlinear optics and sensing." },
  },
  {
    title: 'Plasmonics: Subwavelength Light Manipulation at Metal Surfaces',
    content: `## Surface Plasmon Polaritons\n\nPlasmonics exploits collective electron oscillations at metal-dielectric interfaces to confine and manipulate light beyond the diffraction limit.\n\n## Plasmon Physics\n\n### Dispersion Relation\n- Asymptotic approach to surface plasma frequency\n- Strong field confinement near interface\n- Short propagation lengths due to Ohmic losses\n\n### Localized Surface Plasmons\n- Nanoparticle resonances\n- Mie theory for spherical particles\n- Tunable via shape and size\n\n## Plasmonic Devices\n\n- **Waveguides**: Metal-insulator-metal, insulator-metal-insulator\n- **Modulators**: Electro-optic plasmonic modulators\n- **Sensors**: Surface plasmon resonance (SPR) biosensors\n- **Metamaterials**: Negative refractive index\n\n## Applications\n\n- Ultrasensitive biosensing\n- Heat-assisted magnetic recording\n- Photothermal therapy\n- Enhanced spectroscopy (SERS, SEIRA)\n- Quantum plasmonics and single-photon sources`,
    source: 'publication',
    discipline: 'photonics',
    viewCount: 178,
    metadata: { subDiscipline: 'nano-optics', tags: ['Plasmonics', 'Nanophotonics', 'Metamaterial', 'Biosensor'], authors: ['Maier, S.A.', 'Barnes, W.L.'], year: 2024, abstract: "A review of plasmonics, covering surface plasmon polaritons, plasmonic devices, and applications in sensing and metamaterials." },
  },
  {
    title: 'Microresonator Frequency Combs: From Kerr Solitons to Applications',
    content: `## Optical Frequency Combs\n\nMicroresonator-based frequency combs generate broadband, equidistant optical spectra from a continuous-wave pump, enabling compact precision metrology.\n\n## Kerr Soliton Formation\n\n### Lugiato-Lefever Equation\n- Balance of anomalous dispersion, Kerr nonlinearity, and cavity loss\n- Single soliton, soliton crystals, and breathers\n\n### Comb Generation Regimes\n- **Primary combs**: Modulation instability\n- **Turing rolls**: Spatial patterns\n- **Chaotic states**: Noisy comb spectrum\n- **Soliton states**: Coherent, low-noise combs\n\n## Key Platforms\n\n- Silica microtoroids\n- Silicon nitride (Si3N4) microresonators\n- Aluminum nitride (AlN)\n- Lithium niobate on insulator\n\n## Applications\n\n- Optical atomic clocks\n- Coherent communications\n- Spectroscopy and sensing\n- LiDAR and ranging\n- Microwave photonics`,
    source: 'paper',
    discipline: 'photonics',
    viewCount: 189,
    metadata: { subDiscipline: 'integrated-photonics', tags: ['Frequency Comb', 'Kerr Soliton', 'Microresonator', 'Integrated Photonics'], authors: ['Kippenberg, T.J.', 'Gaeta, A.L.'], year: 2024, abstract: "A review of microresonator frequency combs, covering Kerr soliton physics, generation regimes, and applications in metrology and communications." },
  },
  {
    title: 'Topological Photonics: Edge States and Robust Light Transport',
    content: `## Topology in Photonics\n\nTopological photonics draws inspiration from condensed matter physics to create photonic systems with protected edge states immune to disorder.\n\n## Key Concepts\n\n### Berry Phase and Chern Number\n- Geometric phase acquired during cyclic evolution\n- Chern number classifies topological phases\n\n### Bulk-Edge Correspondence\n- Topological invariant of bulk predicts edge states\n- Unidirectional propagation at domain walls\n\n## Photonic Realizations\n\n- **Photonic crystals**: Analogous to electronic topological insulators\n- **Coupled resonator arrays**: Effective magnetic field for photons\n- **Waveguide lattices**: Floquet topological systems\n\n## Topological Lasers\n\n- Lasing on topological edge states\n- Robust against fabrication defects\n- Arrays of micro-ring resonators\n\n## Applications\n\n- Robust optical delay lines\n- Topological quantum computing\n- Disorder-immune optical circuits\n- Valley-polarized devices`,
    source: 'publication',
    discipline: 'photonics',
    viewCount: 145,
    metadata: { subDiscipline: 'topological-photonics', tags: ['Topological Photonics', 'Edge States', 'Photonic Crystal', 'Berry Phase'], authors: ['Lu, L.', 'Soljacic, M.'], year: 2024, abstract: "An introduction to topological photonics, covering Berry phases, bulk-edge correspondence, and applications in robust light transport." },
  },

  // ==================== MATERIALS SCIENCE (+4) ====================
  {
    title: 'Topological Insulators and the Quantum Spin Hall Effect',
    content: `## Topological Materials\n\nTopological insulators are materials with an insulating bulk but conducting surface states protected by time-reversal symmetry.\n\n## Quantum Spin Hall Effect\n\n### 2D Topological Insulators\n- HgTe/CdTe quantum wells\n- Helical edge states: opposite spins counter-propagate\n- No backscattering from non-magnetic impurities\n\n### Z2 Invariant\n- Kane-Mele invariant classifies 2D topological phases\n- Odd number of Kramers pairs at edge\n\n## 3D Topological Insulators\n\n- **Strong**: Surface Dirac cone on all surfaces\n- **Weak**: Dirac cones only on specific surfaces\n- Bi2Se3, Bi2Te3, Sb2Te3\n\n## Experimental Signatures\n\n- Angle-resolved photoemission (ARPES)\n- Transport measurements\n- Scanning tunneling microscopy\n\n## Applications\n\n- Dissipationless interconnects\n- Topological quantum computing (Majorana zero modes)\n- Spintronics devices`,
    source: 'paper',
    discipline: 'materials-science',
    viewCount: 167,
    metadata: { subDiscipline: 'semiconductors', tags: ['Topological Insulator', 'Quantum Spin Hall', 'Dirac Cone', 'Spintronics'], authors: ['Kane, C.L.', 'Mele, E.J.'], year: 2024, abstract: "A review of topological insulators and the quantum spin Hall effect, covering 2D and 3D systems and applications." },
  },
  {
    title: 'Perovskite Solar Cells: Materials Engineering and Stability Challenges',
    content: `## Perovskite Photovoltaics\n\nMetal halide perovskites have emerged as a transformative material for solar cells, achieving >26% efficiency in just a decade.\n\n## Crystal Structure\n\n- ABX3 structure: A=MA/FA/Cs, B=Pb/Sn, X=I/Br/Cl\n- Soft lattice with ionic-covalent bonding\n- Tunable bandgap via halide mixing\n\n## Device Architectures\n\n- **n-i-p**: Mesoporous or planar\n- **p-i-n**: Inverted structure, better stability\n- **Tandem**: Perovskite on silicon, >33% efficiency\n\n## Efficiency Improvements\n\n- Interface engineering\n- Additive passivation\n- 2D/3D heterostructures\n\n## Stability Challenges\n\n- Moisture degradation\n- Ion migration\n- Thermal stress\n- UV-induced decomposition\n\n## Encapsulation Strategies\n\n- Scalable deposition methods\n- Lead-free alternatives (Sn-based)\n- Industrial manufacturing pathways`,
    source: 'publication',
    discipline: 'materials-science',
    viewCount: 234,
    metadata: { subDiscipline: 'optoelectronic-materials', tags: ['Perovskite', 'Solar Cell', 'Photovoltaics', 'Stability'], authors: ['Green, M.A.', 'Snaith, H.J.'], year: 2024, abstract: "A review of perovskite solar cells, covering materials engineering, device architectures, efficiency improvements, and stability challenges." },
  },
  {
    title: 'Two-Dimensional Materials Beyond Graphene: Transition Metal Dichalcogenides',
    content: `## The 2D Materials Family\n\nBeyond graphene, a rich family of 2D materials offers diverse electronic, optical, and mechanical properties.\n\n## Transition Metal Dichalcogenides (TMDs)\n\n### Structure\n- MX2 formula: M=Mo, W; X=S, Se, Te\n- Monolayers with direct bandgap\n- Strong spin-orbit coupling and valley polarization\n\n### Electronic Properties\n- Semiconducting (MoS2, WSe2)\n- Metallic (NbSe2, TiTe2)\n- Superconducting (NbSe2 at low T)\n\n## Optoelectronic Properties\n\n- Valley-selective optical excitation\n- Strong exciton binding energies\n- Room-temperature valley coherence\n\n## Heterostructures\n\n- van der Waals stacking\n- Moire superlattices and flat bands\n- Interlayer excitons\n\n## Applications\n\n- Flexible electronics\n- Valleytronic devices\n- Catalysis (hydrogen evolution)\n- Quantum emitters\n- Next-generation transistors`,
    source: 'publication',
    discipline: 'materials-science',
    viewCount: 189,
    metadata: { subDiscipline: '2d-materials', tags: ['2D Materials', 'TMD', 'Graphene', 'Valleytronics', 'Moire'], authors: ['Wang, Q.H.', 'Xu, X.'], year: 2024, abstract: "A review of 2D materials beyond graphene, focusing on transition metal dichalcogenides and their optoelectronic applications." },
  },
  {
    title: 'Metamaterials for Electromagnetic Wave Control',
    content: `## Artificial Electromagnetic Materials\n\nMetamaterials are engineered structures with subwavelength unit cells that exhibit properties not found in natural materials.\n\n## Negative Index Materials\n\n- Simultaneous negative epsilon and mu\n- Backward-propagating waves\n- Perfect lens possibility (Pendry)\n\n## Key Metamaterial Types\n\n### Split-Ring Resonators\n- Magnetic response at optical frequencies\n- Tunable via geometry\n\n### Fishnet Structures\n- Broadband negative index\n- Optical frequency operation\n\n### Dielectric Metamaterials\n- Low-loss Mie resonances\n- Silicon nanostructures\n\n## Functional Applications\n\n- **Cloaking**: Transformation optics\n- **Perfect absorption**: Metamaterial absorbers\n- **Beam steering**: Gradient metasurfaces\n- **Holography**: Computer-generated metasurface holograms\n\n## Dynamic and Tunable Metamaterials\n\n- Phase-change materials (GST)\n- MEMS-tunable structures\n- Liquid crystal integration`,
    source: 'publication',
    discipline: 'materials-science',
    viewCount: 156,
    metadata: { subDiscipline: 'metamaterials', tags: ['Metamaterial', 'Negative Index', 'Metasurface', 'Transformation Optics'], authors: ['Smith, D.R.', 'Pendry, J.B.'], year: 2024, abstract: "A review of metamaterials for electromagnetic wave control, covering negative index materials, functional applications, and tunable designs." },
  },

  // ==================== CHEMISTRY (+3) ====================
  {
    title: 'Supramolecular Chemistry: Molecular Recognition and Self-Assembly',
    content: `## Beyond the Molecule\n\nSupramolecular chemistry studies non-covalent interactions that govern molecular recognition, self-assembly, and host-guest chemistry.\n\n## Non-Covalent Interactions\n\n- **Hydrogen bonding**: Directional, strength 5-30 kJ/mol\n- **van der Waals forces**: Dispersion interactions\n- **pi-pi stacking**: Aromatic interactions\n- **Electrostatic interactions**: Ion pairing\n- **Hydrophobic effect**: Entropy-driven in water\n\n## Molecular Recognition\n\n### Crown Ethers and Cryptands\n- Size-selective cation binding\n- Pedersen, Cram, and Lehn (Nobel 1987)\n\n### Cyclodextrins\n- Toroidal glucose oligomers\n- Drug encapsulation and delivery\n\n### Calixarenes\n- Bowl-shaped host molecules\n- Anion and cation recognition\n\n## Self-Assembly\n\n- Amphiphile micellization\n- DNA origami\n- Metal-organic frameworks (MOFs)\n- Supramolecular polymers\n\n## Applications\n\n- Molecular machines (Nobel 2016)\n- Drug delivery systems\n- Chemical sensors\n- Catalytic nanoreactors`,
    source: 'wiki',
    discipline: 'chemistry',
    viewCount: 123,
    metadata: { subDiscipline: 'organic-chemistry', tags: ['Supramolecular Chemistry', 'Self-Assembly', 'Molecular Recognition', 'Host-Guest'], authors: ['Lehn, J.-M.', 'Stoddart, J.F.'], year: 2024, abstract: "An introduction to supramolecular chemistry, covering non-covalent interactions, molecular recognition, and self-assembly applications." },
  },
  {
    title: 'Metal-Organic Frameworks as Heterogeneous Catalysts',
    content: `## Catalysis in MOFs\n\nMetal-organic frameworks combine crystalline porosity with tunable active sites, enabling unique catalytic opportunities.\n\n## Catalytic Strategies\n\n### Metal Node Catalysis\n- Open metal sites as Lewis acid centers\n- Oxidation and hydrogenation\n\n### Linker Catalysis\n- Metalloporphyrin linkers\n- Organocatalytic functional groups\n\n### Encapsulated Catalysts\n- Ship-in-a-bottle catalysts\n- Enzyme immobilization\n\n### Post-Synthetic Modification\n- Functional group introduction\n- Metal exchange\n\n## Advantages for Catalysis\n\n- **High surface area**: >5000 m2/g accessible\n- **Tunable pore size**: Molecular sieving effects\n- **Framework flexibility**: Responsive to substrates\n- **Structural uniformity**: Single-site catalysis\n\n## Applications\n\n- CO2 fixation and conversion\n- Fine chemical synthesis\n- Biomass valorization\n- Photocatalytic water splitting`,
    source: 'paper',
    discipline: 'chemistry',
    viewCount: 145,
    metadata: { subDiscipline: 'materials-chemistry', tags: ['MOF', 'Catalysis', 'Heterogeneous', 'Porous Materials'], authors: ['Yaghi, O.M.', 'Farha, O.K.'], year: 2024, abstract: "A review of metal-organic frameworks as heterogeneous catalysts, covering catalytic strategies and applications in green chemistry." },
  },
  {
    title: 'Electrochemical CO2 Reduction: Catalysts and Mechanisms',
    content: `## CO2 Electroreduction\n\nConverting CO2 to valuable fuels and chemicals using renewable electricity addresses both carbon capture and energy storage.\n\n## Thermodynamic and Kinetic Challenges\n\n- CO2 is thermodynamically stable\n- Multiple proton-electron transfer pathways\n- Competing hydrogen evolution reaction (HER)\n\n## Catalyst Classes\n\n### Metal Catalysts\n- **Cu**: Produces hydrocarbons (CH4, C2H4)\n- **Ag, Au**: CO production\n- **Sn, Bi**: Formate production\n\n### Molecular Catalysts\n- Metal complexes (Mn, Re, Co porphyrins)\n- Well-defined active sites\n\n### Single-Atom Catalysts\n- M-N-C structures on carbon supports\n- Maximum atom efficiency\n\n## Mechanistic Insights\n\n- *COOH and *CO as key intermediates\n- C-C coupling for C2+ products\n- Local pH effects at electrode surface\n\n## Device Engineering\n\n- Flow cell reactors\n- Gas diffusion electrodes (GDE)\n- Membrane electrode assemblies\n- Full-cell energy efficiency`,
    source: 'publication',
    discipline: 'chemistry',
    viewCount: 178,
    metadata: { subDiscipline: 'physical-chemistry', tags: ['CO2 Reduction', 'Electrochemistry', 'Catalysis', 'Energy Storage'], authors: ['Norskov, J.K.', 'Jaramillo, T.F.'], year: 2024, abstract: "A review of electrochemical CO2 reduction, covering catalyst classes, mechanisms, and device engineering for sustainable fuel production." },
  },

  // ==================== BIOLOGY (+3) ====================
  {
    title: 'Epigenetics: Mechanisms of Gene Regulation Beyond the DNA Sequence',
    content: `## The Epigenetic Layer\n\nEpigenetics describes heritable changes in gene expression that do not alter the underlying DNA sequence.\n\n## DNA Methylation\n\n- Cytosine methylation at CpG dinucleotides\n- Maintenance methyltransferase DNMT1\n- De novo methyltransferases DNMT3A/3B\n- Gene silencing via promoter methylation\n\n## Histone Modifications\n\n### Histone Acetylation\n- HATs add, HDACs remove acetyl groups\n- Generally associated with active transcription\n\n### Histone Methylation\n- Active marks: H3K4me3, H3K36me3\n- Repressive marks: H3K27me3, H3K9me3\n- PRC1/PRC2 polycomb complexes\n\n## Chromatin Remodeling\n\n- ATP-dependent remodeling complexes\n- Nucleosome positioning and accessibility\n- Chromatin accessibility assays (ATAC-seq, DNase-seq)\n\n## Non-Coding RNA\n\n- miRNAs: Post-transcriptional regulation\n- lncRNAs: Chromatin-level regulation\n- piRNAs: Transposon silencing\n\n## Applications\n\n- Cancer epigenetic therapy (HDAC inhibitors)\n- Reprogramming and iPSC generation\n- Aging and age-related diseases`,
    source: 'wiki',
    discipline: 'biology',
    viewCount: 167,
    metadata: { subDiscipline: 'molecular-biology', tags: ['Epigenetics', 'DNA Methylation', 'Histone', 'Gene Regulation'], authors: ['Allis, C.D.', 'Bird, A.'], year: 2024, abstract: "An overview of epigenetic mechanisms including DNA methylation, histone modifications, and non-coding RNA regulation." },
  },
  {
    title: 'The Human Microbiome: Composition, Function, and Therapeutic Engineering',
    content: `## Our Microbial Partners\n\nThe human body hosts trillions of microorganisms collectively known as the microbiome, playing crucial roles in health and disease.\n\n## Body Site Communities\n\n### Gut Microbiome\n- Dominated by Firmicutes and Bacteroidetes\n- Fermentation of dietary fiber to short-chain fatty acids\n- Butyrate, propionate, acetate production\n\n### Skin Microbiome\n- Staphylococcus, Cutibacterium, Corynebacterium\n- Site-specific communities (oily, moist, dry)\n\n### Oral Microbiome\n- Biofilm formation on teeth\n- Periodontal disease associations\n\n## Microbiome-Disease Links\n\n- **Metabolic**: Obesity, type 2 diabetes\n- **Inflammatory**: IBD, Crohn disease\n- **Neurological**: Gut-brain axis, Parkinson disease\n- **Cancer**: Fusobacterium nucleatum and colorectal cancer\n\n## Therapeutic Engineering\n\n- **Probiotics**: Live beneficial microbes\n- **Prebiotics**: Dietary substrates for beneficial microbes\n- **Fecal Microbiota Transplantation (FMT)**\n- **Engineered probiotics**: Programmed therapeutic delivery\n- **Phage therapy**: Targeted bacterial elimination`,
    source: 'publication',
    discipline: 'biology',
    viewCount: 198,
    metadata: { subDiscipline: 'biomedical-science', tags: ['Microbiome', 'Gut Health', 'Probiotics', 'Metabolism'], authors: ['Ley, R.E.', 'Gordon, J.I.'], year: 2024, abstract: "A review of the human microbiome, covering community composition, disease associations, and therapeutic engineering approaches." },
  },
  {
    title: 'Stem Cell Biology and Regenerative Medicine Applications',
    content: `## Cellular Plasticity\n\nStem cells possess the unique capacity for self-renewal and differentiation into specialized cell types, forming the basis of regenerative medicine.\n\n## Stem Cell Types\n\n### Embryonic Stem Cells (ESCs)\n- Pluripotent: can form all three germ layers\n- Derived from inner cell mass of blastocyst\n- Ethical considerations\n\n### Induced Pluripotent Stem Cells (iPSCs)\n- Somatic cells reprogrammed with Yamanaka factors (Oct4, Sox2, Klf4, c-Myc)\n- Patient-specific disease modeling\n- Drug screening platforms\n\n### Adult Stem Cells\n- Hematopoietic stem cells (HSCs)\n- Mesenchymal stem cells (MSCs)\n- Neural stem cells\n\n## Directed Differentiation\n\n- Growth factor-guided protocols\n- Organoid technology (mini-organs in vitro)\n- 3D bioprinting\n\n## Clinical Applications\n\n- Hematopoietic stem cell transplantation\n- CAR-T cell therapy\n- Retinal pigment epithelium for macular degeneration\n- Cardiomyocyte patches for heart failure\n- Beta cell replacement for diabetes`,
    source: 'publication',
    discipline: 'biology',
    viewCount: 234,
    metadata: { subDiscipline: 'biomedical-science', tags: ['Stem Cells', 'Regenerative Medicine', 'iPSC', 'Organoid'], authors: ['Thomson, J.A.', 'Yamanaka, S.'], year: 2024, abstract: "A review of stem cell biology, covering ESCs, iPSCs, directed differentiation, and clinical applications in regenerative medicine." },
  },

  // ==================== COMPUTER SCIENCE (+3) ====================
  {
    title: 'Operating Systems: Kernel Design and Virtualization Technology',
    content: `## OS Kernel Architecture\n\nThe operating system kernel is the core software layer managing hardware resources and providing abstractions to applications.\n\n## Kernel Types\n\n### Monolithic Kernels\n- Linux, traditional Unix\n- All OS services in kernel space\n- High performance, tight coupling\n\n### Microkernels\n- Minix, QNX, seL4\n- Minimal kernel with user-space services\n- Better isolation and security\n\n### Hybrid Kernels\n- Windows NT, macOS XNU\n- Monolithic + microkernel features\n\n## Process and Memory Management\n\n- Scheduling algorithms (CFS, O(1))\n- Virtual memory and paging\n- Copy-on-write optimization\n\n## Virtualization\n\n### Hardware Virtualization\n- Intel VT-x and AMD-V extensions\n- Type 1 (bare metal) and Type 2 (hosted) hypervisors\n\n### Containerization\n- Linux namespaces and cgroups\n- Docker and Kubernetes\n- OS-level virtualization efficiency\n\n### Unikernels\n- Single-address-space OS\n- Library OS for cloud applications\n\n## Security\n\n- Address Space Layout Randomization (ASLR)\n- Control-flow integrity\n- Kernel hardening (KASLR, SMEP, SMAP)`,
    source: 'wiki',
    discipline: 'computer-science',
    viewCount: 189,
    metadata: { subDiscipline: 'systems', tags: ['Operating System', 'Kernel', 'Virtualization', 'Container'], authors: ['Tanenbaum, A.S.', 'Silberschatz, A.'], year: 2024, abstract: "An overview of operating system kernel design, covering architecture types, virtualization technologies, and security mechanisms." },
  },
  {
    title: 'Distributed Databases: Consistency Models and System Design',
    content: `## Scaling Data Storage\n\nDistributed databases partition and replicate data across multiple nodes to achieve scalability, availability, and fault tolerance.\n\n## Consistency Models\n\n### Strong Consistency\n- Linearizability\n- Sequential consistency\n- High coordination cost\n\n### Eventual Consistency\n- BASE semantics (Basically Available, Soft state, Eventual consistency)\n- Conflict resolution strategies\n\n### Causal Consistency\n- Preserves happens-before relationships\n- Practical middle ground\n\n## Replication Strategies\n\n- **Primary-backup**: Single writer, multiple readers\n- **Multi-master**: Concurrent writes, conflict resolution\n- **Quorum-based**: R + W > N for consistency\n\n## Partitioning\n\n- Hash partitioning\n- Range partitioning\n- Consistent hashing for elastic scaling\n\n## Notable Systems\n\n- **Google Spanner**: TrueTime for external consistency\n- **CockroachDB**: Serializable default\n- **Cassandra**: Tunable consistency\n- **MongoDB**: Document model with replica sets\n\n## Transaction Processing\n\n- Two-phase commit (2PC)\n- Sagas and compensating transactions\n- Calvin protocol for deterministic ordering`,
    source: 'publication',
    discipline: 'computer-science',
    viewCount: 156,
    metadata: { subDiscipline: 'databases', tags: ['Distributed Database', 'Consistency', 'Replication', 'CAP Theorem'], authors: ['Brewer, E.', 'Lampson, B.'], year: 2024, abstract: "A review of distributed database design, covering consistency models, replication strategies, and notable systems." },
  },
  {
    title: 'Real-Time Ray Tracing and Global Illumination in Computer Graphics',
    content: `## Photorealistic Rendering\n\nRay tracing simulates the physical behavior of light to produce photorealistic images, now achievable in real time on modern GPUs.\n\n## Ray Tracing Fundamentals\n\n### Ray Casting\n- Primary rays from camera through pixels\n- Ray-object intersection tests\n- Acceleration structures (BVH, k-d tree)\n\n### Recursive Ray Tracing\n- Reflection rays\n- Refraction/transmission rays\n- Shadow rays\n\n## Global Illumination\n\n### Path Tracing\n- Monte Carlo integration of light paths\n- Russian roulette for path termination\n- Unbiased but noisy at low samples\n\n### Photon Mapping\n- Photon tracing from light sources\n- Radiance estimation via density estimation\n\n### Bidirectional Methods\n- Bidirectional path tracing\n- Metropolis light transport\n\n## Real-Time Ray Tracing\n\n- NVIDIA RTX / DXR / Vulkan RT\n- Hybrid rasterization + ray tracing\n- Denoising with neural networks\n\n## Applications\n\n- Cinematic rendering and VFX\n- Architectural visualization\n- Video games (Cyberpunk 2077, Minecraft RTX)\n- Product design and automotive`,
    source: 'publication',
    discipline: 'computer-science',
    viewCount: 212,
    metadata: { subDiscipline: 'software-engineering', tags: ['Ray Tracing', 'Global Illumination', 'Computer Graphics', 'Path Tracing'], authors: ['Pharr, M.', 'Jensen, H.W.'], year: 2024, abstract: "A review of real-time ray tracing and global illumination, covering fundamentals, path tracing, and GPU-accelerated rendering." },
  },

  // ==================== MATHEMATICS (+3) ====================
  {
    title: 'Differential Geometry and Its Role in General Relativity',
    content: `## Geometry of Spacetime\n\nDifferential geometry provides the mathematical language for Einstein's General Relativity, describing curved spacetime and gravitational physics.\n\n## Manifolds and Tensors\n\n### Differentiable Manifolds\n- Charts and atlases\n- Tangent spaces and cotangent spaces\n\n### Tensor Calculus\n- Covariant and contravariant vectors\n- Metric tensor g_{\\mu\\nu}\n- Christoffel symbols and connections\n\n## Curvature\n\n### Riemann Curvature Tensor\n- R^{\\rho}_{\\sigma\\mu\\nu} captures local curvature\n- Symmetries and Bianchi identities\n\n### Ricci Tensor and Scalar\n- R_{\\mu\\nu} = R^{\\rho}_{\\mu\\rho\\nu}\n- R = g^{\\mu\\nu}R_{\\mu\\nu}\n\n## Einstein Field Equations\n\nG_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = (8\\pi G/c^4) T_{\\mu\\nu}\n\n- G_{\\mu\\nu}: Einstein tensor\n- T_{\\mu\\nu}: Stress-energy tensor\n- \\Lambda: Cosmological constant\n\n## Geodesics\n\n- Shortest paths in curved spacetime\n- Free-fall trajectories\n- Light deflection and gravitational lensing\n\n## Applications\n\n- Black hole physics\n- Gravitational waves\n- Cosmological models (FLRW)\n- GPS relativistic corrections`,
    source: 'wiki',
    discipline: 'mathematics',
    viewCount: 178,
    metadata: { subDiscipline: 'applied-mathematics', tags: ['Differential Geometry', 'General Relativity', 'Tensor Calculus', 'Curvature'], authors: ['Wald, R.M.', 'Carroll, S.M.'], year: 2024, abstract: "An introduction to differential geometry and its application to general relativity, covering manifolds, curvature, and Einstein field equations." },
  },
  {
    title: 'Numerical Linear Algebra for Large-Scale Scientific Computing',
    content: `## Matrix Computations at Scale\n\nNumerical linear algebra underpins scientific computing, machine learning, and data analysis, with algorithms optimized for modern hardware.\n\n## Direct Methods\n\n### LU and Cholesky Factorization\n- Gaussian elimination with pivoting\n- Symmetric positive definite systems\n- Block algorithms for cache efficiency\n\n### QR Factorization\n- Householder reflections\n- Givens rotations\n- Least squares problems\n\n### Sparse Direct Methods\n- Fill-reducing orderings (AMD, nested dissection)\n- Supernodal factorization\n\n## Iterative Methods\n\n### Krylov Subspace Methods\n- Conjugate Gradient (CG) for SPD systems\n- GMRES for general nonsymmetric\n- BiCGSTAB and variants\n\n### Preconditioning\n- Jacobi, Gauss-Seidel, SOR\n- Incomplete factorization (ILU, IC)\n- Algebraic multigrid (AMG)\n\n## Eigenvalue Problems\n\n- Power iteration and inverse iteration\n- QR algorithm\n- Lanczos and Arnoldi methods\n- Implicitly Restarted Arnoldi (ARPACK)\n\n## Modern Challenges\n\n- Mixed-precision algorithms\n- GPU acceleration (cuBLAS, cuSOLVER)\n- Randomized numerical linear algebra\n- Communication-avoiding algorithms`,
    source: 'publication',
    discipline: 'mathematics',
    viewCount: 145,
    metadata: { subDiscipline: 'computational-mathematics', tags: ['Numerical Linear Algebra', 'Krylov Methods', 'Eigenvalue', 'Preconditioning'], authors: ['Golub, G.H.', 'Trefethen, L.N.'], year: 2024, abstract: "A review of numerical linear algebra for large-scale computing, covering direct methods, iterative solvers, and modern hardware optimization." },
  },
  {
    title: 'Bayesian Statistics and Probabilistic Inference Methods',
    content: `## The Bayesian Framework\n\nBayesian statistics provides a coherent framework for updating beliefs with evidence, treating parameters as random variables.\n\n## Bayes' Theorem\n\nP(\\theta|D) = P(D|\\theta) P(\\theta) / P(D)\n\n- Prior: P(\\theta), beliefs before data\n- Likelihood: P(D|\\theta), data generation model\n- Posterior: P(\\theta|D), updated beliefs\n- Evidence: P(D), marginal likelihood\n\n## Prior Distributions\n\n- **Conjugate priors**: Analytical posteriors\n- **Jeffreys prior**: Objective, transformation-invariant\n- **Hierarchical priors**: Sharing information across groups\n\n## Computational Methods\n\n### Markov Chain Monte Carlo (MCMC)\n- Metropolis-Hastings algorithm\n- Gibbs sampling\n- Hamiltonian Monte Carlo (HMC)\n- No-U-Turn Sampler (NUTS)\n\n### Variational Inference\n- KL divergence minimization\n- Mean-field approximation\n- Black-box variational inference\n\n### Approximate Methods\n- Laplace approximation\n- Expectation propagation\n\n## Applications\n\n- Model comparison and selection\n- Bayesian neural networks\n- Causal inference\n- A/B testing\n- Probabilistic programming (Stan, PyMC, NumPyro)`,
    source: 'publication',
    discipline: 'mathematics',
    viewCount: 167,
    metadata: { subDiscipline: 'statistics', tags: ['Bayesian Statistics', 'MCMC', 'Variational Inference', 'Probabilistic Programming'], authors: ['Gelman, A.', 'Bishop, C.M.'], year: 2024, abstract: "A review of Bayesian statistics and probabilistic inference, covering computational methods and applications in modern data science." },
  },

  // ==================== ENGINEERING (+3) ====================
  {
    title: 'Microelectromechanical Systems (MEMS): Design, Fabrication, and Applications',
    content: `## Microsystems Technology\n\nMEMS integrates mechanical elements, sensors, actuators, and electronics on a silicon substrate, enabling miniaturized devices.\n\n## Fabrication Processes\n\n### Bulk Micromachining\n- Wet etching (KOH, TMAH)\n- Deep reactive ion etching (DRIE/Bosch process)\n\n### Surface Micromachining\n- Sacrificial layer techniques\n- Polysilicon structural layers\n\n### Wafer Bonding\n- Anodic bonding (glass-silicon)\n- Fusion bonding (silicon-silicon)\n\n## Key Devices\n\n### Inertial Sensors\n- Accelerometers (capacitive, piezoelectric)\n- Gyroscopes (vibrating, tuning fork)\n- IMUs for navigation and smartphones\n\n### Pressure Sensors\n- Piezoresistive\n- Capacitive diaphragm\n\n### Optical MEMS\n- DLP micromirror arrays (Texas Instruments)\n- MEMS scanning mirrors for LiDAR\n\n### RF MEMS\n- Switches, filters, resonators\n- Tunable capacitors and inductors\n\n## Applications\n\n- Automotive (airbags, TPMS)\n- Consumer electronics\n- Biomedical (lab-on-chip)\n- Optical switching and displays`,
    source: 'publication',
    discipline: 'engineering',
    viewCount: 156,
    metadata: { subDiscipline: 'electronic-engineering', tags: ['MEMS', 'Microfabrication', 'Sensor', 'Actuator'], authors: ['Senturia, S.D.', 'Kovacs, G.T.A.'], year: 2024, abstract: "A review of MEMS technology, covering fabrication processes, key device types, and applications across industries." },
  },
  {
    title: 'Wireless Communication Systems: From 5G to 6G and Beyond',
    content: `## Evolution of Wireless Networks\n\nWireless communication continues to evolve, with 5G already deployed and 6G research underway for 2030 deployment.\n\n## 5G NR Key Technologies\n\n### New Radio (NR)\n- Sub-6 GHz and mmWave (24-71 GHz)\n- Massive MIMO (64-256 antennas)\n- Beamforming and beam management\n\n### Network Architecture\n- Standalone (SA) vs Non-Standalone (NSA)\n- Network slicing for diverse services\n- Edge computing integration\n\n## 5G Use Cases\n\n- **eMBB**: Enhanced mobile broadband\n- **uRLLC**: Ultra-reliable low-latency communication\n- **mMTC**: Massive machine-type communication\n\n## 6G Vision and Research\n\n### Target Metrics\n- 1 Tbps peak data rate\n- 0.1 ms latency\n- 10x energy efficiency vs 5G\n\n### Enabling Technologies\n- Terahertz communication (100 GHz - 10 THz)\n- Intelligent reflecting surfaces (IRS)\n- Integrated sensing and communication (ISAC)\n- AI-native air interface\n- Cell-free massive MIMO\n\n### New Applications\n- Holographic communications\n- Digital twin networks\n- Brain-computer interfaces\n- Tactile internet and teleoperation`,
    source: 'wiki',
    discipline: 'engineering',
    viewCount: 245,
    metadata: { subDiscipline: 'electronic-engineering', tags: ['5G', '6G', 'Wireless', 'MIMO', 'mmWave'], authors: ['Rappaport, T.S.', 'Marzetta, T.L.'], year: 2024, abstract: "An overview of wireless communication systems, covering 5G NR technologies and 6G research directions." },
  },
  {
    title: 'Aerospace Engineering: Aerodynamics, Propulsion, and Flight Mechanics',
    content: `## The Physics of Flight\n\nAerospace engineering applies principles of fluid dynamics, thermodynamics, and mechanics to design aircraft and spacecraft.\n\n## Aerodynamics\n\n### Incompressible Flow\n- Potential flow theory\n- Boundary layer theory (Prandtl)\n- Lift and drag forces\n- Airfoil design and optimization\n\n### Compressible Flow\n- Mach number regimes\n- Shock waves and expansion fans\n- Transonic and supersonic aerodynamics\n\n### Computational Fluid Dynamics\n- RANS, LES, and DNS approaches\n- Turbulence modeling\n- Aerodynamic shape optimization\n\n## Propulsion Systems\n\n### Turbofan Engines\n- Bypass ratio optimization\n- Turbine entry temperature limits\n\n### Rocket Propulsion\n- Liquid vs solid propellants\n- Specific impulse and thrust-to-weight\n- Staging and orbital mechanics\n\n### Electric Propulsion\n- Hall effect thrusters\n- Ion engines\n- Applications in satellite station-keeping\n\n## Flight Mechanics\n\n- 6-DOF equations of motion\n- Stability and control derivatives\n- Guidance, navigation, and control (GNC)\n- Autonomous flight systems`,
    source: 'wiki',
    discipline: 'engineering',
    viewCount: 189,
    metadata: { subDiscipline: 'mechanical-engineering', tags: ['Aerodynamics', 'Propulsion', 'CFD', 'Flight Mechanics'], authors: ['Anderson, J.D.', 'Sutton, G.P.'], year: 2024, abstract: "An overview of aerospace engineering, covering aerodynamics, propulsion systems, and flight mechanics." },
  },

  // ==================== MEDICINE (+5) ====================
  {
    title: 'Precision Medicine and Pharmacogenomics: Tailoring Treatment to the Individual',
    content: `## Personalized Healthcare\n\nPrecision medicine uses genomic, molecular, and clinical data to tailor prevention and treatment strategies to individual patients.\n\n## Pharmacogenomics\n\n### Drug Metabolism\n- Cytochrome P450 polymorphisms\n- CYP2D6, CYP2C19, CYP3A4 variants\n- Impact on drug efficacy and toxicity\n\n### Warfarin Dosing\n- VKORC1 and CYP2C9 genotypes\n- Dose prediction algorithms\n\n### Cancer Pharmacogenomics\n- TPMT and thiopurine toxicity\n- DPYD and 5-FU toxicity\n- SLCO1B1 and statin myopathy\n\n## Biomarker-Guided Therapy\n\n- **Oncology**: EGFR, ALK, BRAF mutations\n- **Cardiology**: CYP2C19 for clopidogrel\n- **Psychiatry**: HLA-B*57:01 for abacavir\n\n## Challenges\n\n- Polygenic drug response\n- Population diversity in variant frequencies\n- Clinical implementation barriers\n- Regulatory frameworks for companion diagnostics\n\n## Future Directions\n\n- Whole-genome sequencing in clinics\n- Real-world evidence integration\n- AI-driven drug response prediction\n- Pharmacogenomic panels in routine care`,
    source: 'publication',
    discipline: 'medicine',
    viewCount: 178,
    metadata: { subDiscipline: 'clinical-medicine', tags: ['Precision Medicine', 'Pharmacogenomics', 'Personalized Medicine', 'Biomarker'], authors: ['Ashley, E.A.', 'Roden, D.M.'], year: 2024, abstract: "A review of precision medicine and pharmacogenomics, covering drug metabolism genetics, biomarker-guided therapy, and clinical implementation." },
  },
  {
    title: 'Neuroimaging Techniques: fMRI, EEG, and MEG in Brain Research',
    content: `## Mapping Brain Function\n\nNeuroimaging provides non-invasive windows into brain structure and function, essential for neuroscience research and clinical diagnosis.\n\n## Functional MRI (fMRI)\n\n### BOLD Signal\n- Blood-oxygen-level-dependent contrast\n- Neurovascular coupling\n- Hemodynamic response function\n\n### Experimental Designs\n- Block designs\n- Event-related designs\n- Resting-state connectivity\n\n### Analysis Methods\n- GLM for task-based fMRI\n- ICA for network identification\n- Graph theory for connectivity analysis\n\n## Electroencephalography (EEG)\n\n- Electrical activity at scalp surface\n- High temporal resolution (ms)\n- Limited spatial resolution\n- Event-related potentials (ERPs)\n\n## Magnetoencephalography (MEG)\n\n- Magnetic fields from neural currents\n- Better spatial resolution than EEG\n- Source localization algorithms\n\n## Multimodal Integration\n\n- fMRI-EEG fusion\n- Structural MRI for anatomical constraints\n- PET for molecular imaging\n\n## Clinical Applications\n\n- Epilepsy localization\n- Pre-surgical planning\n- Stroke assessment\n- Neurodegenerative disease monitoring`,
    source: 'publication',
    discipline: 'medicine',
    viewCount: 198,
    metadata: { subDiscipline: 'medical-imaging', tags: ['fMRI', 'EEG', 'MEG', 'Neuroimaging', 'Brain'], authors: ['Huettel, S.A.', 'Cohen, M.S.'], year: 2024, abstract: "A review of neuroimaging techniques including fMRI, EEG, and MEG, covering principles, analysis methods, and clinical applications." },
  },
  {
    title: 'Tissue Engineering and Biomaterials for Organ Regeneration',
    content: `## Building Replacement Tissues\n\nTissue engineering combines cells, biomaterial scaffolds, and bioactive factors to regenerate or replace damaged tissues and organs.\n\n## Scaffold Materials\n\n### Natural Polymers\n- Collagen and gelatin\n- Alginate and chitosan\n- Decellularized extracellular matrix\n\n### Synthetic Polymers\n- PLA, PGA, PCL and copolymers\n- PEG hydrogels\n- Degradation rate matching tissue formation\n\n### Ceramics\n- Hydroxyapatite for bone\n- Bioactive glasses\n\n## Fabrication Techniques\n\n- Electrospinning for nanofibrous scaffolds\n- 3D bioprinting with cell-laden bioinks\n- Decellularization of natural organs\n- Microfluidic organ-on-chip platforms\n\n## Cell Sources\n\n- Autologous cells (patient-specific)\n- Allogeneic stem cells\n- iPSC-derived differentiated cells\n\n## Vascularization Challenges\n\n- Angiogenic factor delivery\n- Pre-vascularization strategies\n- Anastomosis with host vasculature\n\n## Clinical Progress\n\n- Skin substitutes (Integra, Apligraf)\n- Cartilage repair (MACI)\n- Bladder reconstruction\n- Trachea replacement\n- Solid organ challenges (liver, heart, kidney)`,
    source: 'publication',
    discipline: 'medicine',
    viewCount: 156,
    metadata: { subDiscipline: 'biomedical', tags: ['Tissue Engineering', 'Biomaterials', 'Scaffold', 'Organ Regeneration'], authors: ['Langer, R.', 'Vacanti, J.P.'], year: 2024, abstract: "A review of tissue engineering and biomaterials for organ regeneration, covering scaffold design, fabrication, and clinical progress." },
  },
  {
    title: 'Infectious Disease Epidemiology and Global Health Surveillance',
    content: `## Disease Surveillance Systems\n\nGlobal health surveillance monitors infectious disease patterns, enabling early detection and response to outbreaks.\n\n## Epidemiological Models\n\n### Compartmental Models\n- SIR: Susceptible-Infected-Recovered\n- SEIR: With exposed compartment\n- Basic reproduction number R0\n\n### Network Models\n- Contact network structure\n- Superspreading events\n- Heterogeneous mixing\n\n### Agent-Based Models\n- Individual-level simulation\n- Policy impact assessment\n\n## Surveillance Technologies\n\n- **Genomic surveillance**: Pathogen sequencing for variant tracking\n- **Wastewater monitoring**: Community-level early warning\n- **Syndromic surveillance**: Emergency department data\n- **Digital epidemiology**: Social media and search trends\n\n## Case Studies\n\n- COVID-19 pandemic response\n- Influenza surveillance (GISAID)\n- Ebola outbreak tracking\n- Antimicrobial resistance monitoring\n\n## One Health Approach\n\n- Human-animal-environment interface\n- Zoonotic disease prevention\n- Vector surveillance and control\n\n## Challenges\n\n- Data sharing and privacy\n- Healthcare system capacity\n- Vaccine equity and distribution\n- Emerging pathogen preparedness`,
    source: 'publication',
    discipline: 'medicine',
    viewCount: 134,
    metadata: { subDiscipline: 'clinical-medicine', tags: ['Epidemiology', 'Public Health', 'Surveillance', 'Infectious Disease'], authors: ['Anderson, R.M.', 'Ferguson, N.M.'], year: 2024, abstract: "A review of infectious disease epidemiology and global health surveillance, covering models, technologies, and outbreak response." },
  },
  {
    title: 'Neurodegenerative Diseases: Mechanisms and Therapeutic Strategies',
    content: `## Protein Misfolding Disorders\n\nNeurodegenerative diseases including Alzheimer's, Parkinson's, and ALS are characterized by protein aggregation and neuronal death.\n\n## Alzheimer's Disease\n\n### Pathology\n- Amyloid-beta plaques\n- Neurofibrillary tangles (tau)\n- Synaptic dysfunction and neuroinflammation\n\n### Genetics\n- APOE4 risk variant\n- APP, PSEN1, PSEN2 mutations\n\n### Therapeutics\n- Anti-amyloid antibodies (lecanemab, donanemab)\n- BACE inhibitors\n- Tau-targeting therapies\n\n## Parkinson's Disease\n\n- Alpha-synuclein Lewy bodies\n- Dopaminergic neuron loss in substantia nigra\n- LRRK2 and SNCA mutations\n- DBS and gene therapy approaches\n\n## ALS and Frontotemporal Dementia\n\n- TDP-43 and FUS proteinopathy\n- C9orf72 hexanucleotide repeat expansion\n- Riluzole and edaravone\n- Antisense oligonucleotide therapies\n\n## Common Mechanisms\n\n- Protein misfolding and aggregation\n- Mitochondrial dysfunction\n- Oxidative stress\n- Neuroinflammation\n- Impaired autophagy\n\n## Emerging Therapies\n\n- Gene therapy (AAV delivery)\n- Stem cell replacement\n- Immunotherapy approaches\n- Proteostasis modulators`,
    source: 'publication',
    discipline: 'medicine',
    viewCount: 267,
    metadata: { subDiscipline: 'biomedical', tags: ['Neurodegeneration', 'Alzheimer', 'Parkinson', 'Protein Aggregation'], authors: ['Hardy, J.', 'Holtzman, D.M.'], year: 2024, abstract: "A review of neurodegenerative disease mechanisms and therapeutic strategies, covering Alzheimer`s, Parkinson's, and emerging therapies." },
  },

  // ==================== ECONOMICS (+5) ====================
  {
    title: 'Behavioral Economics and Nudge Theory in Public Policy',
    content: `## Psychology Meets Economics\n\nBehavioral economics integrates psychological insights into economic models, revealing how cognitive biases systematically affect decision-making.\n\n## Key Cognitive Biases\n\n- **Loss aversion**: Losses loom larger than equivalent gains\n- **Anchoring**: Over-reliance on first information\n- **Present bias**: Preference for immediate rewards\n- **Mental accounting**: Categorization of money into mental buckets\n- **Social proof**: Following others' behavior\n\n## Nudge Theory\n\n### Libertarian Paternalism\n- Preserving choice while guiding decisions\n- Choice architecture design\n\n### Nudge Types\n- **Defaults**: Pre-selected options\n- **Social norms**: Highlighting typical behavior\n- **Salience**: Making important features visible\n- **Simplification**: Reducing complexity\n- **Feedback**: Timely information provision\n\n## Policy Applications\n\n- **Retirement savings**: Auto-enrollment in 401(k)\n- **Organ donation**: Opt-out systems\n- **Tax compliance**: Simplified filing\n- **Public health**: Calorie labeling, anti-smoking\n- **Energy conservation**: Smart meter feedback\n\n## Critiques and Debates\n\n- Replication crisis in behavioral research\n- Sludge (harmful nudges)\n- Ethical concerns about manipulation\n- Context dependence of effects`,
    source: 'publication',
    discipline: 'economics',
    viewCount: 189,
    metadata: { subDiscipline: 'microeconomics', tags: ['Behavioral Economics', 'Nudge', 'Cognitive Bias', 'Public Policy'], authors: ['Thaler, R.H.', 'Kahneman, D.'], year: 2024, abstract: "A review of behavioral economics and nudge theory, covering cognitive biases, choice architecture, and public policy applications." },
  },
  {
    title: 'International Trade Theory and Global Supply Chain Economics',
    content: `## Foundations of Trade\n\nInternational trade theory explains why nations exchange goods and services, and how trade affects welfare and distribution.\n\n## Classical and Modern Trade Theory\n\n### Comparative Advantage (Ricardo)\n- Gains from specialization\n- Opportunity cost differences\n\n### Heckscher-Ohlin Model\n- Factor endowment differences drive trade\n- Stolper-Samuelson theorem\n\n### New Trade Theory (Krugman)\n- Economies of scale and product differentiation\n- Intra-industry trade\n\n### Melitz Model\n- Firm heterogeneity and export selection\n- Only most productive firms export\n\n## Global Value Chains\n\n### Fragmentation of Production\n- Task-based trade\n- Offshoring and reshoring decisions\n\n### Supply Chain Networks\n- Just-in-time vs resilient supply chains\n- Geographic concentration risks\n\n## Trade Policy\n\n- Tariffs and quotas\n- Regional trade agreements\n- WTO dispute resolution\n\n## Contemporary Issues\n\n- US-China trade tensions\n- Nearshoring and friendshoring\n- Digital trade and cross-border data flows\n- Carbon border adjustment mechanisms\n- Supply chain resilience post-COVID`,
    source: 'publication',
    discipline: 'economics',
    viewCount: 156,
    metadata: { subDiscipline: 'macroeconomics', tags: ['International Trade', 'Supply Chain', 'Comparative Advantage', 'Globalization'], authors: ['Krugman, P.R.', 'Antras, P.'], year: 2024, abstract: "A review of international trade theory and global supply chain economics, covering classical models and contemporary policy issues." },
  },
  {
    title: 'Game Theory: Strategic Interaction in Economics and Business',
    content: `## The Mathematics of Strategy\n\nGame theory models strategic interactions where outcomes depend on the choices of multiple rational agents.\n\n## Fundamental Concepts\n\n### Normal Form Games\n- Players, strategies, and payoff matrices\n- Nash equilibrium\n- Dominant and dominated strategies\n\n### Extensive Form Games\n- Game trees and sequential moves\n- Subgame perfect equilibrium\n- Backward induction\n\n### Types of Games\n- **Cooperative vs non-cooperative**\n- **Zero-sum vs positive-sum**\n- **Symmetric vs asymmetric**\n- **Complete vs incomplete information**\n\n## Important Game Models\n\n### Prisoner's Dilemma\n- Individual rationality vs collective optimum\n- Applications: oligopoly pricing, arms races\n\n### Coordination Games\n- Multiple equilibria and focal points\n- Network effects and standards\n\n### Auction Theory\n- First-price, second-price, all-pay\n- Revenue equivalence theorem\n- Mechanism design\n\n## Applications\n\n- Oligopoly and market competition\n- Bargaining and negotiations\n- Voting and political economy\n- Auction design (spectrum, ad markets)\n- Evolutionary game theory in biology`,
    source: 'wiki',
    discipline: 'economics',
    viewCount: 178,
    metadata: { subDiscipline: 'microeconomics', tags: ['Game Theory', 'Nash Equilibrium', 'Strategic Interaction', 'Auction Theory'], authors: ['Nash, J.', 'Tirole, J.'], year: 2024, abstract: "An introduction to game theory, covering fundamental concepts, classic game models, and applications in economics and business." },
  },
  {
    title: 'Environmental Economics: Carbon Pricing and Climate Policy Design',
    content: `## Economics of Climate Change\n\nEnvironmental economics applies economic principles to environmental problems, with climate change representing the greatest market failure in history.\n\n## Market Failure and Externalities\n\n- Carbon emissions as negative externality\n- Social cost of carbon\n- Tragedy of the commons\n\n## Carbon Pricing Instruments\n\n### Carbon Taxes\n- Price certainty, quantity uncertainty\n- Revenue recycling options\n- Examples: Sweden, British Columbia\n\n### Cap-and-Trade Systems\n- Quantity certainty, price uncertainty\n- EU ETS (world's largest)\n- Allowance allocation (auction vs free)\n\n### Hybrid Approaches\n- Price floors and ceilings\n- Carbon border adjustments\n\n## Policy Evaluation\n\n- Cost-effectiveness analysis\n- Distributional impacts\n- Competitiveness concerns\n- Leakage and border adjustments\n\n## Complementary Policies\n\n- Renewable energy subsidies\n- Energy efficiency standards\n- R&D investment in clean tech\n- Just transition programs\n\n## International Cooperation\n\n- Paris Agreement and NDCs\n- Article 6 carbon markets\n- Climate finance mechanisms`,
    source: 'publication',
    discipline: 'economics',
    viewCount: 145,
    metadata: { subDiscipline: 'macroeconomics', tags: ['Environmental Economics', 'Carbon Pricing', 'Climate Policy', 'Externalities'], authors: ['Nordhaus, W.D.', 'Stern, N.'], year: 2024, abstract: "A review of environmental economics, covering carbon pricing instruments, policy design, and international climate cooperation." },
  },
  {
    title: 'Financial Econometrics: Volatility Modeling and Risk Management',
    content: `## Quantitative Finance\n\nFinancial econometrics applies statistical methods to financial data, essential for asset pricing, risk management, and trading.\n\n## Time Series Properties\n\n### Stylized Facts\n- Volatility clustering\n- Fat tails (leptokurtosis)\n- Leverage effects\n- Long memory in volatility\n\n## Volatility Models\n\n### ARCH/GARCH\n- ARCH(p): Volatility depends on past squared returns\n- GARCH(p,q): Adds autoregressive volatility term\n- EGARCH: Asymmetric response to shocks\n\n### Stochastic Volatility\n- Latent volatility process\n- Kalman filter estimation\n\n### Realized Volatility\n- High-frequency data aggregation\n- Jump-robust estimators\n\n## Risk Management\n\n### Value at Risk (VaR)\n- Parametric, historical, Monte Carlo methods\n- Backtesting and model validation\n\n### Expected Shortfall\n- Conditional VaR\n- Coherent risk measure\n\n### Copula Models\n- Dependence structure modeling\n- Tail dependence in crises\n\n## Applications\n\n- Portfolio optimization\n- Derivatives pricing\n- Regulatory capital requirements (Basel)\n- Stress testing`,
    source: 'paper',
    discipline: 'economics',
    viewCount: 134,
    metadata: { subDiscipline: 'econometrics', tags: ['Financial Econometrics', 'GARCH', 'Risk Management', 'Volatility'], authors: ['Engle, R.F.', 'Bollerslev, T.'], year: 2024, abstract: "A review of financial econometrics, covering volatility models, risk measures, and applications in quantitative finance." },
  },

  // ==================== SOCIAL SCIENCES (+6) ====================
  {
    title: 'Cognitive Psychology: Models of Memory and Human Decision Making',
    content: `## The Architecture of Cognition\n\nCognitive psychology studies mental processes including memory, attention, perception, and decision making.\n\n## Memory Systems\n\n### Sensory Memory\n- Iconic (visual) and echoic (auditory)\n- Very brief duration (<1 second)\n\n### Working Memory\n- Baddeley's model: phonological loop, visuospatial sketchpad, episodic buffer, central executive\n- Capacity: 7 +/- 2 chunks (Miller) or 4 items (Cowan)\n\n### Long-Term Memory\n- Explicit/declarative (episodic, semantic)\n- Implicit/procedural (skills, priming, conditioning)\n- Encoding, storage, retrieval processes\n\n## Decision Making\n\n### Dual-Process Theory\n- System 1: Fast, automatic, heuristic\n- System 2: Slow, deliberate, analytical\n\n### Heuristics and Biases\n- Availability heuristic\n- Representativeness heuristic\n- Affect heuristic\n\n### Prospect Theory\n- Reference dependence\n- Diminishing sensitivity\n- Loss aversion\n\n## Attention and Perception\n\n- Selective attention (cocktail party effect)\n- Inattentional blindness\n- Change blindness\n- Top-down vs bottom-up processing`,
    source: 'wiki',
    discipline: 'social-sciences',
    viewCount: 167,
    metadata: { subDiscipline: 'psychology', tags: ['Cognitive Psychology', 'Memory', 'Decision Making', 'Attention'], authors: ['Kahneman, D.', 'Baddeley, A.'], year: 2024, abstract: "An overview of cognitive psychology, covering memory systems, dual-process decision making, and attention mechanisms." },
  },
  {
    title: 'Sociology of Science: Academic Communities and Knowledge Production',
    content: `## Science as a Social Institution\n\nThe sociology of science examines how social structures, norms, and practices shape scientific knowledge production.\n\n## Mertonian Norms\n\nRobert Merton identified institutional imperatives of science:\n- **Universalism**: Truth claims evaluated by universal criteria\n- **Communism**: Scientific knowledge is common property\n- **Disinterestedness**: Scientists serve the scientific ethos\n- **Organized Skepticism**: All claims subject to scrutiny\n\n## Scientific Communities\n\n### Invisible Colleges\n- Informal networks of researchers\n- Citation patterns and collaboration\n\n### Paradigms and Revolutions\n- Kuhn's normal science and paradigm shifts\n- Scientific revolutions and incommensurability\n\n### Boundary Work\n- Distinguishing science from non-science\n- Expertise and authority claims\n\n## Contemporary Issues\n\n- **Peer review**: Bias, alternatives, open review\n- **Publication incentives**: Publish-or-perish culture\n- **Reproducibility crisis**: Failed replication studies\n- **Open science**: Preprints, open data, open access\n- **Diversity in STEM**: Gender and racial disparities\n\n## Science and Society\n\n- Science policy and funding\n- Public understanding of science\n- Science communication\n- Expertise in democratic societies`,
    source: 'publication',
    discipline: 'social-sciences',
    viewCount: 123,
    metadata: { subDiscipline: 'sociology', tags: ['Sociology of Science', 'Academic Community', 'Peer Review', 'Open Science'], authors: ['Merton, R.K.', 'Latour, B.'], year: 2024, abstract: "A review of the sociology of science, covering Mertonian norms, scientific communities, and contemporary issues in knowledge production." },
  },
  {
    title: 'Science Communication: Strategies for Public Engagement',
    content: `## Bridging Science and Society\n\nEffective science communication translates complex research for diverse audiences, building public understanding and trust.\n\n## Communication Models\n\n### Deficit Model\n- Public lacks knowledge; fill the gap\n- Limited effectiveness\n\n### Dialogue Model\n- Two-way engagement and discussion\n- Public participation in science\n\n### Participation Model\n- Citizen science and co-creation\n- Democratization of knowledge\n\n## Effective Strategies\n\n### Narrative and Storytelling\n- Personal stories of scientists\n- Research as journey of discovery\n- Emotional connection\n\n### Visual Communication\n- Infographics and data visualization\n- Scientific illustration\n- Video and animation\n\n### Digital Platforms\n- Social media for scientists\n- Science blogging and podcasting\n- YouTube and TikTok science content\n\n## Challenges\n\n- Misinformation and conspiracy theories\n- Political polarization of science\n- Trust in experts (post-COVID dynamics)\n- Communicating uncertainty\n- Simplification without distortion\n\n## Evaluation\n\n- Knowledge outcome measurement\n- Attitude and behavior change\n- Public engagement metrics`,
    source: 'publication',
    discipline: 'social-sciences',
    viewCount: 145,
    metadata: { subDiscipline: 'education', tags: ['Science Communication', 'Public Engagement', 'STEM Education', 'Misinformation'], authors: ['Brossard, D.', 'Scheufele, D.A.'], year: 2024, abstract: "A review of science communication strategies, covering communication models, effective engagement methods, and challenges." },
  },
  {
    title: 'Research Ethics and Responsible Conduct in Scientific Practice',
    content: `## Integrity in Research\n\nResearch ethics ensures that scientific inquiry is conducted with honesty, respect, and accountability.\n\n## Core Principles\n\n### Honesty\n- Accurate reporting of methods and results\n- No fabrication, falsification, or plagiarism\n\n### Objectivity\n- Minimizing bias in experimental design\n- Transparent conflict of interest disclosure\n\n### Integrity\n- Consistent adherence to ethical standards\n- Keeping promises and agreements\n\n### Carefulness\n- Avoiding errors and negligence\n- Proper record keeping\n\n### Openness\n- Sharing data and materials\n- Receptive to criticism\n\n### Respect for Intellectual Property\n- Proper attribution\n- Patent and copyright compliance\n\n### Confidentiality\n- Protecting sensitive information\n- Human subjects privacy\n\n### Social Responsibility\n- Considering societal consequences\n- Environmental impact\n\n## Common Violations\n\n- Data fabrication and falsification\n- Plagiarism and self-plagiarism\n- Authorship disputes\n- Duplicate publication\n- Image manipulation\n\n## Oversight\n\n- Institutional Review Boards (IRBs)\n- Research integrity offices\n- Whistleblower protections`,
    source: 'wiki',
    discipline: 'social-sciences',
    viewCount: 112,
    metadata: { subDiscipline: 'academic-writing', tags: ['Research Ethics', 'Academic Integrity', 'Responsible Conduct', 'Scientific Practice'], authors: ['Shamoo, A.E.', 'Resnik, D.B.'], year: 2024, abstract: "A guide to research ethics and responsible conduct in scientific practice, covering core principles and common violations." },
  },
  {
    title: 'Digital Humanities and Computational Methods in Social Science Research',
    content: `## Computational Social Science\n\nDigital humanities and computational social science leverage large-scale data and algorithms to study culture, society, and human behavior.\n\n## Data Sources\n\n### Textual Data\n- Historical archives and digitized books\n- Social media text\n- News corpora\n- Parliamentary records\n\n### Network Data\n- Social networks\n- Citation networks\n- Trade and migration networks\n\n### Geospatial Data\n- Historical GIS\n- Remote sensing\n- Mobile phone data\n\n## Computational Methods\n\n### Natural Language Processing\n- Named entity recognition\n- Sentiment analysis\n- Topic modeling (LDA)\n- Word embeddings and semantic change\n\n### Network Analysis\n- Centrality and community detection\n- Temporal network evolution\n- Multilayer networks\n\n### Machine Learning\n- Classification and clustering\n- Predictive modeling\n- Causal inference from observational data\n\n## Ethical Considerations\n\n- Privacy and consent in big data\n- Algorithmic bias\n- Reproducibility\n- Digital divide in research access\n\n## Case Studies\n\n- Culturomics and Google Books Ngram\n- Twitter sentiment and election prediction\n- Historical network analysis`,
    source: 'publication',
    discipline: 'social-sciences',
    viewCount: 134,
    metadata: { subDiscipline: 'education', tags: ['Digital Humanities', 'Computational Social Science', 'NLP', 'Network Analysis'], authors: ['Lazer, D.M.', 'Michel, J.-B.'], year: 2024, abstract: "A review of digital humanities and computational social science, covering data sources, methods, and ethical considerations." },
  },
  {
    title: 'Psychology of Learning: Evidence-Based Strategies for Education',
    content: `## Science of Learning\n\nThe psychology of learning identifies evidence-based strategies that enhance knowledge retention and skill acquisition.\n\n## Cognitive Principles\n\n### Retrieval Practice\n- Active recall strengthens memory\n- Testing effect: retrieval > re-reading\n- Spaced retrieval schedules\n\n### Spaced Practice\n- Distributed study beats massed practice\n- Optimal spacing intervals increase over time\n\n### Interleaving\n- Mixing topics improves discrimination\n- Better than blocked practice\n\n### Elaboration\n- Connecting new knowledge to existing\n- Self-explanation and elaborative interrogation\n\n### Concrete Examples\n- Abstract concepts need grounding\n- Varied examples promote transfer\n\n### Dual Coding\n- Visual + verbal processing\n- Diagrams with text\n\n## Metacognition\n\n- Self-monitoring of understanding\n- Calibration of confidence\n- Judgments of learning (JOLs)\n\n## Motivation and Mindset\n\n- Growth mindset (Dweck)\n- Self-determination theory\n- Grit and deliberate practice\n\n## Classroom Applications\n\n- Formative assessment\n- Desirable difficulties\n- Feedback timing and specificity\n- Collaborative learning`,
    source: 'publication',
    discipline: 'social-sciences',
    viewCount: 198,
    metadata: { subDiscipline: 'education', tags: ['Learning Science', 'Retrieval Practice', 'Education', 'Cognitive Psychology'], authors: ['Roediger, H.L.', 'Dunlosky, J.'], year: 2024, abstract: "A review of evidence-based learning strategies from cognitive psychology, covering retrieval practice, spacing, and metacognition." },
  },

  // ==================== EARTH SCIENCES (+5) ====================
  {
    title: 'Remote Sensing and Satellite Earth Observation Systems',
    content: `## Eyes on Earth\n\nSatellite remote sensing provides global, repeated observations critical for environmental monitoring, agriculture, and disaster response.\n\n## Sensor Types\n\n### Passive Sensors\n- **Multispectral**: Landsat, Sentinel-2 (VIS-NIR-SWIR)\n- **Hyperspectral**: Hundreds of narrow bands\n- **Thermal**: Land surface temperature\n\n### Active Sensors\n- **SAR (Synthetic Aperture Radar)**: All-weather, day-night\n- **LiDAR**: 3D surface and canopy structure\n- **Altimetry**: Sea level and ice sheet elevation\n\n## Key Satellite Missions\n\n- **Landsat**: 50+ years of Earth observation\n- **Sentinel (ESA)**: Free, open data\n- **MODIS/VIIRS**: Daily global coverage\n- **ICESat**: Ice sheet monitoring\n- **GRACE**: Gravity and water storage\n\n## Applications\n\n### Land Cover and Land Use\n- Deforestation monitoring\n- Urban expansion\n- Agricultural mapping\n\n### Environmental Monitoring\n- Wildfire detection and tracking\n- Flood mapping\n- Drought assessment\n\n### Climate Science\n- Sea ice extent\n- Glacier mass balance\n- Carbon cycle (GPP, NPP)\n\n### Disaster Response\n- Rapid damage assessment\n- Search and rescue support`,
    source: 'publication',
    discipline: 'earth-sciences',
    viewCount: 167,
    metadata: { subDiscipline: 'atmospheric', tags: ['Remote Sensing', 'Satellite', 'Earth Observation', 'GIS'], authors: ['Jensen, J.R.', 'Elachi, C.'], year: 2024, abstract: "A review of remote sensing and satellite Earth observation, covering sensor types, key missions, and applications." },
  },
  {
    title: 'Paleoclimatology: Reading Climate History from Ice Cores and Sediments',
    content: `## Climate Archives\n\nPaleoclimatology reconstructs past climates from natural archives, extending instrumental records over millennia.\n\n## Ice Core Records\n\n### Greenland and Antarctic Cores\n- Layered accumulation of snow\n- Gas bubbles: ancient atmosphere (CO2, CH4, N2O)\n- Isotopes: delta-18O and delta-D as temperature proxies\n- Dust and aerosol records\n\n### Key Findings\n- CO2-temperature coupling over 800,000 years\n- Abrupt climate transitions (Dansgaard-Oeschger events)\n- Last Glacial Maximum (LGM, ~20,000 years ago)\n\n## Marine Sediments\n\n- Foraminifera oxygen isotopes\n- Alkenone unsaturation (UK37) for SST\n- Sediment accumulation rates\n\n## Tree Rings (Dendrochronology)\n
- Annual resolution\n- Ring width and isotope proxies\n- Calibration with instrumental data\n\n## Speleothems and Corals\n\n- Cave deposits: O and C isotopes\n- Corals: Sr/Ca and delta-18O for SST\n\n## Climate Forcings\n\n- Orbital (Milankovitch cycles)\n- Solar variability\n- Volcanic eruptions\n- Greenhouse gas concentrations\n\n## Relevance to Future Climate\n\n- Analogs for future warming\n- Climate sensitivity estimates\n- Tipping points and hysteresis`,
    source: 'publication',
    discipline: 'earth-sciences',
    viewCount: 134,
    metadata: { subDiscipline: 'atmospheric', tags: ['Paleoclimatology', 'Ice Core', 'Climate History', 'Proxy'], authors: ['Alley, R.B.', 'Jansen, E.'], year: 2024, abstract: "A review of paleoclimatology, covering ice cores, marine sediments, and climate proxy reconstructions." },
  },
  {
    title: 'Hydrology and Water Resource Management in a Changing Climate',
    content: `## The Water Cycle\n\nHydrology studies the distribution, movement, and properties of water on Earth, critical for managing freshwater resources.\n\n## Hydrological Processes\n\n### Precipitation\n- Rainfall-runoff relationships\n- Snowmelt dynamics\n- Extreme event frequency\n\n### Evapotranspiration\n- Penman-Monteith equation\n- Remote sensing estimates\n\n### Groundwater\n- Aquifer properties and flow\n- Recharge and discharge\n- Over-extraction and subsidence\n\n### River Systems\n- Rating curves and discharge\n- Flood routing\n- Sediment transport\n\n## Water Resource Challenges\n\n### Scarcity\n- Physical vs economic scarcity\n- Arid regions and drought\n- Transboundary water conflicts\n\n### Quality\n- Point and non-point pollution\n- Emerging contaminants\n- Salinization\n\n### Climate Change Impacts\n- Altered precipitation patterns\n- Glacier retreat and water supply\n- More intense floods and droughts\n\n## Management Approaches\n\n- Integrated Water Resources Management (IWRM)\n- Managed aquifer recharge\n- Water pricing and markets\n- Nature-based solutions\n- Desalination technologies`,
    source: 'wiki',
    discipline: 'earth-sciences',
    viewCount: 123,
    metadata: { subDiscipline: 'environmental', tags: ['Hydrology', 'Water Resources', 'Climate Change', 'Groundwater'], authors: ['Maidment, D.R.', 'Gleick, P.H.'], year: 2024, abstract: "An overview of hydrology and water resource management, covering hydrological processes and challenges in a changing climate." },
  },
  {
    title: 'Natural Hazard Assessment: Earthquakes, Tsunamis, and Early Warning Systems',
    content: `## Understanding Natural Hazards\n\nNatural hazard assessment combines geophysics, statistics, and engineering to evaluate risks and develop mitigation strategies.\n\n## Seismic Hazard\n\n### Earthquake Physics\n- Elastic rebound theory\n- Fault mechanics and rupture dynamics\n- Magnitude scales (moment magnitude Mw)\n\n### Probabilistic Seismic Hazard Analysis\n- Ground motion prediction equations\n- Return periods and exceedance probabilities\n- Building code development\n\n### Early Warning\n- P-wave detection before S-wave arrival\n- ShakeAlert and EEW systems\n- Seconds to tens of seconds of warning\n\n## Tsunami Hazard\n\n- Submarine earthquake sources\n- Landslide and volcanic tsunamis\n- Propagation modeling and inundation mapping\n- DART buoy network\n\n## Other Hazards\n\n- Volcanic eruptions and ash hazard\n- Landslides and debris flows\n- Tropical cyclones and storm surges\n\n## Risk Assessment\n\n- Hazard x Exposure x Vulnerability\n- Probabilistic risk modeling\n- Catastrophe (cat) models\n\n## Mitigation\n\n- Building codes and retrofitting\n- Land-use planning\n- Insurance and financial mechanisms\n- Community preparedness and drills`,
    source: 'publication',
    discipline: 'earth-sciences',
    viewCount: 156,
    metadata: { subDiscipline: 'geology', tags: ['Natural Hazard', 'Earthquake', 'Tsunami', 'Early Warning'], authors: ['Stein, S.', 'Satake, K.'], year: 2024, abstract: "A review of natural hazard assessment, covering earthquakes, tsunamis, and early warning systems." },
  },
  {
    title: 'Oceanography: Physical Processes and Marine Ecosystem Dynamics',
    content: `## The Global Ocean\n\nOceans cover 71% of Earth's surface and play a fundamental role in climate regulation, carbon cycling, and biodiversity.\n\n## Physical Oceanography\n\n### Ocean Circulation\n- Wind-driven gyres (Ekman transport)\n- Thermohaline circulation (global conveyor belt)\n- Western boundary currents (Gulf Stream, Kuroshio)\n\n### Waves and Tides\n- Surface gravity waves\n- Internal waves at density interfaces\n- Tidal forcing and amphidromic systems\n\n### Mixing Processes\n- Turbulent mixing in boundary layers\n- Double diffusion\n- Breaking internal waves\n\n## Marine Biogeochemistry\n\n- Biological pump and carbon export\n- Nutrient cycles (N, P, Fe)\n- Ocean acidification\n- Oxygen minimum zones\n\n## Ecosystem Dynamics\n\n- Phytoplankton blooms\n- Food web structure\n- Fisheries and overfishing\n- Coral reef ecology and bleaching\n\n## Climate Connections\n\n- Ocean heat uptake and thermal expansion\n- El Nino-Southern Oscillation (ENSO)\n- Atlantic Meridional Overturning Circulation (AMOC)\n- Sea level rise projections`,
    source: 'publication',
    discipline: 'earth-sciences',
    viewCount: 145,
    metadata: { subDiscipline: 'oceanography', tags: ['Oceanography', 'Marine Ecosystem', 'Ocean Circulation', 'Climate'], authors: ['Stewart, R.H.', 'Thurman, H.V.'], year: 2024, abstract: "An overview of oceanography, covering physical processes, biogeochemistry, marine ecosystems, and climate connections." },
  },

  // ==================== INTERDISCIPLINARY (+4) ====================
  {
    title: 'Computational Social Science: Big Data Approaches to Understanding Human Behavior',
    content: `## Data-Driven Social Science\n\nComputational social science leverages large-scale digital data and computational methods to study human social behavior at unprecedented scales.\n\n## Data Sources\n\n- Social media platforms (Twitter, Facebook)\n- Mobile phone call detail records\n- Credit card transactions\n- Web browsing and search logs\n- Geographic mobility traces\n\n## Methodological Approaches\n\n### Network Science\n- Social network analysis at scale\n- Community detection in large graphs\n- Information diffusion modeling\n\n### Text Analysis\n- Sentiment analysis at population scale\n- Topic modeling for cultural trends\n- Political polarization detection\n\n### Agent-Based Modeling\n- Simulating emergent social phenomena\n- Calibration with real-world data\n\n## Key Findings\n\n- Human mobility patterns (Levy flights)\n- Social tie strength and structure\n- Predictability of individual behavior\n- Echo chambers and filter bubbles\n\n## Ethical Challenges\n\n- Privacy and informed consent\n- Algorithmic bias and fairness\n- Reproducibility\n- Responsible use of sensitive data`,
    source: 'publication',
    discipline: 'interdisciplinary',
    viewCount: 178,
    metadata: { subDiscipline: 'multi-disciplinary', tags: ['Computational Social Science', 'Big Data', 'Social Network', 'Human Behavior'], authors: ['Lazer, D.M.', 'Pentland, A.'], year: 2024, abstract: "A review of computational social science, covering big data sources, methodological approaches, and ethical challenges." },
  },
  {
    title: 'Neuromorphic Computing: Brain-Inspired Hardware for Efficient AI',
    content: `## Computing Like the Brain\n\nNeuromorphic computing designs hardware that mimics biological neural networks, offering orders-of-magnitude efficiency gains for AI workloads.\n\n## Biological Inspiration\n\n- **Spiking neurons**: Event-driven computation\n- **Synaptic plasticity**: STDP learning rules\n- **Asynchronous operation**: No global clock\n- **In-memory computing**: Collocating memory and processing\n\n## Hardware Implementations\n\n### Digital Neuromorphic\n- Intel Loihi: 128 neuromorphic cores, 130,000 neurons\n- IBM TrueNorth: 1 million neurons, 256 million synapses\n- SpiNNaker: ARM-based, million-core system\n\n### Analog and Mixed-Signal\n- Memristor crossbar arrays\n- Phase-change memory (PCM) synapses\n- Floating-gate transistor synapses\n\n### Emerging Devices\n- Spintronics (spin-orbit torque)\n- Ferroelectric FETs\n- 2D material synapses\n\n## Algorithms\n\n- Spiking Neural Networks (SNNs)\n- Surrogate gradient training\n- Reservoir computing\n- Event-based vision processing\n\n## Advantages\n\n- Ultra-low power (mW vs W)\n- Real-time sensory processing\n- Edge AI applications\n- Continuous learning\n\n## Challenges\n\n- Limited algorithm ecosystem\n- Device variability and noise\n- Programming models\n- Benchmarking standards`,
    source: 'publication',
    discipline: 'interdisciplinary',
    viewCount: 234,
    metadata: { subDiscipline: 'multi-disciplinary', tags: ['Neuromorphic Computing', 'Spiking Neural Networks', 'Memristor', 'Edge AI'], authors: ['Davies, M.', 'Roy, K.'], year: 2024, abstract: "A review of neuromorphic computing, covering brain-inspired hardware, spiking neural networks, and edge AI applications." },
  },
  {
    title: 'Photonic Neural Networks: Optical Acceleration for Machine Learning',
    content: `## Computing at the Speed of Light\n\nPhotonic neural networks use optical components to perform matrix-vector multiplications and neural computations at unprecedented speed and efficiency.\n\n## Photonic Matrix Multiplication\n\n### Mach-Zehnder Interferometer Meshes\n- Reconfigurable unitary transformations\n- Singular value decomposition implementation\n- Silicon photonic integration\n\n### Microring Resonator Weight Banks\n- Wavelength-division multiplexing\n- Analog weight storage\n- Energy-efficient MAC operations\n\n## Optical Nonlinearities\n\n- Saturable absorption\n- Optical parametric amplification\n- Electro-optic modulation\n- Hybrid electronic-photonic approaches\n\n## Architectures\n\n- **Coherent optical neural networks**: Complex-valued weights\n- **Diffractive optical networks**: Free-space propagation\n- **Reservoir computing**: Fixed random connections\n\n## Advantages\n\n- Speed: THz operation potential\n- Energy: ~1 fJ per MAC operation\n- Bandwidth: WDM parallelism\n- Low latency: Optical signal propagation\n\n## Challenges\n\n- Device nonidealities and loss\n- Limited analog precision\n- Optical-electronic interface overhead\n- Scalability and packaging\n\n## Recent Demonstrations\n\n- MIT: Photonic accelerator for deep learning\n- Lightmatter: Envise photonic AI platform\n- NTT: Coherent Ising Machine\n- Optalysys: Optical Fourier transform engine`,
    source: 'publication',
    discipline: 'interdisciplinary',
    viewCount: 198,
    metadata: { subDiscipline: 'optoelectronic-integration', tags: ['Photonic Neural Network', 'Optical Computing', 'AI Acceleration', 'Silicon Photonics'], authors: ['Shastri, B.J.', 'Prucnal, P.R.'], year: 2024, abstract: "A review of photonic neural networks, covering optical matrix multiplication, architectures, and challenges for AI acceleration." },
  },
  {
    title: 'Quantum Biology: Coherence and Entanglement in Living Systems',
    content: `## Quantum Effects in Biology\n\nQuantum biology explores how quantum mechanical phenomena influence biological processes, challenging the classical view of life.\n\n## Photosynthesis\n\n### Light Harvesting\n- Fenna-Matthews-Olson (FMO) complex\n- Quantum coherence in energy transfer\n- Environment-assisted quantum transport\n\n### Evidence\n- 2D electronic spectroscopy\n- Long-lived quantum coherence (fs to ps)\n- Optimized energy funneling\n\n## Enzyme Catalysis\n
### Quantum Tunneling\n- Proton and electron tunneling\n- Kinetic isotope effects\n- Dynamical coupling to protein motion\n\n### Hydrogen Tunneling\n- Room-temperature tunneling in enzymes\n- Temperature-independent rates\n\n## Magnetoreception\n\n- Radical pair mechanism in avian navigation\n- Cryptochrome proteins as magnetosensors\n- Spin chemistry in weak magnetic fields\n\n## Olfaction\n
- Vibrational theory of smell\n- Inelastic electron tunneling spectroscopy\n- Debate with shape theory\n\n## Brain and Consciousness\n
- Microtubule quantum computation (Penrose-Hameroff)\n- Controversial and debated\n- Orch-OR theory\n\n## Methodological Challenges\n\n- Decoherence in warm, wet environments\n- Distinguishing quantum from classical effects\n- Experimental verification difficulties`,
    source: 'paper',
    discipline: 'interdisciplinary',
    viewCount: 167,
    metadata: { subDiscipline: 'multi-disciplinary', tags: ['Quantum Biology', 'Photosynthesis', 'Quantum Coherence', 'Magnetoreception'], authors: ['Lambert, N.', 'Scholes, G.D.'], year: 2024, abstract: "A review of quantum biology, covering quantum coherence in photosynthesis, enzyme tunneling, and magnetoreception." },
  },

  // ==================== ARTIFICIAL INTELLIGENCE (+2) ====================
  {
    title: 'Foundation Models and Large Language Models: Architecture and Capabilities',
    content: `## The Foundation Model Paradigm\n\nFoundation models are large-scale neural networks pre-trained on broad data and adaptable to diverse downstream tasks.\n\n## Transformer Architecture\n\n### Attention Mechanism\n- Self-attention computes pairwise interactions\n- Multi-head attention for diverse representations\n- O(n^2) complexity in sequence length\n\n### Key Components\n- Positional encodings\n- Layer normalization\n- Feed-forward networks\n- Residual connections\n\n## Scaling Laws\n\n- Performance improves predictably with model size, data, and compute\n- Emergent capabilities at scale\n- Chinchilla scaling: optimal compute allocation\n\n## Training Methodologies\n\n### Pre-training\n- Autoregressive (GPT-style)\n- Masked language modeling (BERT-style)\n- Mixture of Denoisers (T5, UL2)\n\n### Alignment\n- Instruction tuning\n- RLHF (Reinforcement Learning from Human Feedback)\n- Constitutional AI and RL-AIF\n\n## Multimodal Extensions\n\n- Vision-language models (CLIP, GPT-4V)\n- Speech and audio understanding\n- Robotics foundation models\n\n## Challenges\n\n- Hallucination and factual errors\n- Bias and fairness\n- Interpretability\n- Energy consumption and environmental impact\n- Safety and alignment`,
    source: 'publication',
    discipline: 'artificial-intelligence',
    viewCount: 345,
    metadata: { subDiscipline: 'deep-learning', tags: ['Foundation Model', 'LLM', 'Transformer', 'Attention'], authors: ['Bommasani, R.', 'Brown, T.'], year: 2024, abstract: "A review of foundation models and large language models, covering architecture, scaling laws, and alignment methodologies." },
  },
  {
    title: 'Reinforcement Learning from Human Feedback and AI Alignment',
    content: `## Aligning AI with Human Intent\n\nRLHF has become the dominant paradigm for aligning large language models with human preferences and values.\n\n## The RLHF Pipeline\n\n### 1. Supervised Fine-Tuning\n- Train on high-quality instruction-response pairs\n- Behavioral cloning from human demonstrations\n\n### 2. Reward Model Training\n- Human annotators rank model outputs\n- Bradley-Terry model for preference learning\n- Reward model predicts human preferences\n\n### 3. Policy Optimization\n- PPO (Proximal Policy Optimization)\n- KL divergence constraint to prevent drift\n- Iterative refinement (RLAIF, Constitutional AI)\n\n## Alternative Approaches\n\n### Direct Preference Optimization\n- Optimize directly on preference data\n- No separate reward model needed\n\n### Constitutional AI\n- AI feedback instead of human feedback\n- Self-critique and revision\n\n### RLHF Variants\n- SLiC: Sequence likelihood calibration\n- IPO: Identity preference optimization\n- KTO: Kahneman-Tversky optimization\n\n## Challenges\n\n- Reward hacking\n- Distribution shift\n- Human annotator disagreement\n- Scalable oversight\n- Value alignment and specification\n\n## Safety Research\n\n- Red teaming and adversarial testing\n- Interpretability for alignment\n- Debate and amplification\n- Mechanistic anomaly detection`,
    source: 'publication',
    discipline: 'artificial-intelligence',
    viewCount: 289,
    metadata: { subDiscipline: 'reinforcement-learning', tags: ['RLHF', 'AI Alignment', 'Reinforcement Learning', 'Preference Learning'], authors: ['Christiano, P.', 'Ouyang, L.'], year: 2024, abstract: "A review of reinforcement learning from human feedback, covering the RLHF pipeline, alternatives, and AI safety research." },
  },
]

async function main() {
  console.log(`Enriching knowledge base with ${DOCUMENTS.length} documents (v3)...`)

  let created = 0
  let skipped = 0

  for (const doc of DOCUMENTS) {
    const existing = await prisma.knowledgeDocument.findFirst({
      where: { title: doc.title },
    })

    if (existing) {
      console.log(`  SKIP (exists): ${doc.title}`)
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

    console.log(`  OK: ${doc.title} (${doc.discipline}, ${doc.viewCount} views)`)
    created++
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`)

  const summary = await prisma.knowledgeDocument.groupBy({
    by: ['discipline'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  console.log('\nKnowledge Base Summary:')
  for (const row of summary) {
    console.log(`  ${row.discipline || 'uncategorized'}: ${row._count.id}`)
  }

  const total = await prisma.knowledgeDocument.count()
  console.log(`  Total: ${total} documents`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
