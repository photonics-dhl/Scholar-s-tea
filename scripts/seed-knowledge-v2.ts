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
  {
    title: 'Density Functional Theory in Computational Materials Design',
    content: `## Overview\n\nDensity Functional Theory (DFT) has become the workhorse of computational materials science, enabling researchers to predict electronic structure, mechanical properties, and chemical reactivity from first principles.\n\n## The Hohenberg-Kohn Theorems\n\nThe foundation of DFT rests on two theorems proved by Hohenberg and Kohn in 1964:\n\n1. **First Theorem**: The ground-state electron density uniquely determines the external potential.\n2. **Second Theorem**: There exists a universal functional of the density that delivers the ground-state energy.\n\n## Exchange-Correlation Functionals\n\nThe accuracy of DFT calculations depends critically on the choice of exchange-correlation functional:\n\n- **LDA** (Local Density Approximation): Simplest form, often underestimates band gaps\n- **GGA** (Generalized Gradient Approximation): Includes density gradients\n- **Hybrid Functionals** (e.g., HSE06, B3LYP): Mix exact exchange, improve band gaps\n- **Meta-GGA** (e.g., SCAN): Include kinetic energy density\n\n## Applications\n\n### Semiconductor Screening\nDFT enables high-throughput screening of thousands of candidate materials for photovoltaic applications.\n\n### Catalysis\nThe computational hydrogen electrode (CHE) model allows prediction of reaction free energies.\n\n### Battery Materials\nDFT+U and hybrid functionals are essential for describing transition metal oxides in lithium-ion batteries.\n\n## Limitations\n\nDespite its success, DFT faces challenges with strongly correlated systems, van der Waals interactions, and excited-state properties.`,
    source: 'wiki',
    discipline: 'chemistry',
    viewCount: 142,
    metadata: { subDiscipline: 'physical-chemistry', tags: ['First-principles', 'Numerical Simulation', 'Theoretical Derivation', 'Materials Chemistry'], authors: ['Kohn, W.', 'Sham, L.J.'], year: 2024, abstract: 'A comprehensive overview of Density Functional Theory, covering foundational theorems, exchange-correlation functionals, and applications in materials design.' },
  },
  {
    title: 'Modern Organic Synthesis Strategies for Pharmaceutical Development',
    content: `## Strategic Approaches in Drug Synthesis\n\nThe synthesis of complex pharmaceutical molecules requires careful retrosynthetic analysis and strategic bond disconnection.\n\n## Key Methodologies\n\n### C-H Functionalization\nDirect C-H activation avoids pre-functionalization steps:\n- **Palladium-catalyzed** directed C-H activation\n- **Photoredox catalysis** for radical C-H functionalization\n- **Electrochemical** C-H oxidation\n\n### Asymmetric Catalysis\nEnantioselective synthesis is critical for drug efficacy:\n- Organocatalysis with chiral amines\n- Transition metal complexes with chiral ligands\n- Biocatalysis using engineered enzymes\n\n### Flow Chemistry\nContinuous flow reactors offer advantages over batch processing:\n- Enhanced heat and mass transfer\n- Safer handling of hazardous intermediates\n- Improved reproducibility and scalability\n\n## Green Chemistry Integration\n\nModern pharmaceutical synthesis incorporates green chemistry principles:\n- Atom economy maximization\n- Solvent minimization and replacement\n- Renewable feedstock utilization`,
    source: 'publication',
    discipline: 'chemistry',
    viewCount: 98,
    metadata: { subDiscipline: 'organic-chemistry', tags: ['Organic Chemistry', 'Drug Discovery', 'Catalysis', 'Green Chemistry'], authors: ['Nicolaou, K.C.', 'Sorensen, E.J.'], year: 2024, abstract: 'An overview of modern organic synthesis strategies including C-H functionalization, asymmetric catalysis, and flow chemistry for pharmaceutical development.' },
  },
  {
    title: 'Molecular Dynamics Simulations of Catalytic Reaction Mechanisms',
    content: `## Introduction\n\nMolecular Dynamics (MD) simulations provide atomistic insights into catalytic reactions, complementing experimental observations with detailed mechanistic understanding.\n\n## Simulation Methods\n\n### Born-Oppenheimer MD\nFor systems where electronic structure changes are important:\n- DFT forces calculated on-the-fly\n- Suitable for reactions involving bond breaking/forming\n\n### Reactive Force Fields\nApproximate methods for larger systems:\n- ReaxFF: bond order-dependent potential\n- Machine learning potentials (e.g., SNAP, ACE)\n\n### Enhanced Sampling Methods\n- **Metadynamics**: history-dependent bias potential\n- **Umbrella Sampling**: along reaction coordinates\n- **Transition Path Sampling**: unbiased exploration\n\n## Applications\n\n### Heterogeneous Catalysis\nUnderstanding reaction mechanisms on metal surfaces:\n- CO oxidation on Pt(111)\n- Ammonia synthesis on Ru catalysts\n\n### Enzymatic Catalysis\nProbing enzyme mechanisms:\n- Proton transfer in carbonic anhydrase\n- C-C bond formation in aldolases\n\n### Zeolite Catalysis\nAcid-catalyzed reactions in confined spaces:\n- Methanol-to-olefins (MTO) process\n- Fluid catalytic cracking (FCC)`,
    source: 'paper',
    discipline: 'chemistry',
    viewCount: 76,
    metadata: { subDiscipline: 'computational-chemistry', tags: ['Molecular Dynamics', 'Computational Chemistry', 'Catalysis', 'ML-assisted'], authors: ['Laio, A.', 'Parrinello, M.'], year: 2024, abstract: 'A review of molecular dynamics simulation methods for studying catalytic reaction mechanisms, covering enhanced sampling techniques and applications.' },
  },
  {
    title: 'Green Chemistry Principles for Sustainable Materials Synthesis',
    content: `## The Twelve Principles of Green Chemistry\n\nPaul Anastas and John Warner's principles guide sustainable chemical design:\n\n1. **Prevention**: Better to prevent waste than clean up after\n2. **Atom Economy**: Maximize incorporation of all materials\n3. **Less Hazardous Synthesis**: Use substances with little toxicity\n4. **Designing Safer Chemicals**: Effective with minimal toxicity\n5. **Safer Solvents**: Minimize auxiliary substances\n6. **Design for Energy Efficiency**: Minimize energy requirements\n7. **Use of Renewable Feedstocks**: When technically practicable\n8. **Reduce Derivatives**: Minimize unnecessary derivatization\n9. **Catalysis**: Catalytic reagents superior to stoichiometric\n10. **Design for Degradation**: Break down into innocuous substances\n11. **Real-time Analysis**: Monitor and control processes\n12. **Inherently Safer Chemistry**: Minimize accident potential\n\n## Sustainable Materials Examples\n\n### Bioplastics\n- **PLA** (Polylactic acid) from corn starch\n- **PHA** (Polyhydroxyalkanoates) from bacterial fermentation\n\n### Metal-Organic Frameworks (MOFs)\nDesigned for carbon capture, hydrogen storage, and water harvesting.`,
    source: 'wiki',
    discipline: 'chemistry',
    viewCount: 65,
    metadata: { subDiscipline: 'materials-chemistry', tags: ['Green Chemistry', 'Sustainable Materials', 'MOF', 'Bioplastics'], authors: ['Anastas, P.T.', 'Warner, J.C.'], year: 2024, abstract: 'A comprehensive guide to green chemistry principles and their application in sustainable materials synthesis.' },
  },
  {
    title: 'Electrochemical Energy Storage: From Lithium-Ion to Solid-State Batteries',
    content: `## Battery Fundamentals\n\nElectrochemical energy storage relies on reversible redox reactions at electrode-electrolyte interfaces.\n\n## Lithium-Ion Battery Technology\n\n### Working Principle\n- **Cathode**: LiCoO2, LiFePO4, NMC\n- **Anode**: Graphite, silicon composites\n- **Electrolyte**: LiPF6 in organic carbonates\n\n### Challenges\n- Energy density limitations (~250 Wh/kg)\n- Safety concerns (thermal runaway)\n- Resource constraints (cobalt supply)\n\n## Next-Generation Technologies\n\n### Solid-State Batteries\n- Ceramic or polymer electrolytes\n- Higher energy density potential\n- Challenges: interfacial impedance\n\n### Sodium-Ion Batteries\n- Abundant raw materials\n- Lower energy density but cost-effective\n\n### Lithium-Sulfur Batteries\n- Theoretical energy density: 2600 Wh/kg\n- Polysulfide shuttle effect challenge\n\n## Characterization Techniques\n\n- **X-ray diffraction**: Phase identification\n- **XPS**: Surface chemistry analysis\n- **EIS**: Impedance spectroscopy\n- **Neutron diffraction**: Li localization`,
    source: 'publication',
    discipline: 'chemistry',
    viewCount: 189,
    metadata: { subDiscipline: 'materials-chemistry', tags: ['Battery', 'Energy Storage', 'Electrochemistry', 'Materials Chemistry'], authors: ['Goodenough, J.B.', 'Whittingham, M.S.'], year: 2024, abstract: 'A review of electrochemical energy storage technologies, from current lithium-ion systems to emerging solid-state and lithium-sulfur batteries.' },
  },
  {
    title: 'CRISPR-Cas9 Gene Editing: Principles and Therapeutic Applications',
    content: `## The CRISPR Revolution\n\nCRISPR-Cas9 has transformed biological research and therapeutic development, enabling precise genome editing.\n\n## Molecular Mechanism\n\n### CRISPR RNA (crRNA)\n- ~20 nt spacer sequence defines target\n- Forms duplex with tracrRNA\n\n### Cas9 Endonuclease\n- RuvC and HNH domains cleave DNA\n- Requires PAM sequence (NGG)\n- Generates double-strand breaks\n\n### DNA Repair Pathways\n1. **NHEJ**: Error-prone, causes insertions/deletions\n2. **HDR**: Precise, requires donor template\n\n## Delivery Systems\n\n### Viral Vectors\n- **AAV**: Safe, limited packaging capacity\n- **Lentivirus**: Integrates, larger capacity\n\n### Non-Viral Methods\n- Lipid nanoparticles (LNPs)\n- Electroporation\n\n## Therapeutic Applications\n\n### Sickle Cell Disease\n- Ex vivo editing of HSCs\n- Disruption of BCL11A enhancer\n- FDA-approved therapy (Casgevy)\n\n### Cancer Immunotherapy\n- Editing T cells for CAR-T therapy\n- PD-1 knockout\n\n## Off-Target Considerations\n\n- GUIDE-seq for off-target detection\n- High-fidelity Cas9 variants\n- Base editing and prime editing`,
    source: 'publication',
    discipline: 'biology',
    viewCount: 234,
    metadata: { subDiscipline: 'molecular-biology', tags: ['CRISPR', 'Gene Editing', 'Therapeutics', 'Molecular Biology'], authors: ['Doudna, J.A.', 'Charpentier, E.'], year: 2024, abstract: 'A comprehensive overview of CRISPR-Cas9 gene editing technology, covering molecular mechanisms, delivery systems, therapeutic applications, and ethical considerations.' },
  },
  {
    title: 'Protein Structure Prediction with Deep Learning: From AlphaFold to Next-Generation Methods',
    content: `## The Protein Folding Problem\n\nPredicting protein 3D structure from amino acid sequence is one of biology's grand challenges, now being solved by deep learning.\n\n## AlphaFold2 Architecture\n\n### Key Components\n- **Evoformer**: Processes MSA and pair representations\n- **Structure Module**: Generates 3D coordinates\n- **Invariant Point Attention**: Maintains geometric constraints\n\n### Accuracy Metrics\n- **GDT_TS**: Global Distance Test\n- **RMSD**: Root Mean Square Deviation\n- **lDDT**: Local Distance Difference Test\n\n## Beyond AlphaFold\n\n### AlphaFold3\n- Extended to protein-ligand and protein-nucleic acid complexes\n- Diffusion-based structure generation\n\n### ESMFold\n- Language model-based prediction\n- Single-sequence input\n- Enables proteome-scale predictions\n\n## Applications\n\n### Drug Discovery\n- Structure-based drug design\n- Virtual screening\n- Allosteric site identification\n\n### Enzyme Engineering\n- Active site architecture prediction\n- Catalytic efficiency optimization\n\n## Limitations\n\n- Intrinsically disordered regions remain challenging\n- Membrane protein accuracy lags\n- Dynamic conformational ensembles not captured`,
    source: 'paper',
    discipline: 'biology',
    viewCount: 312,
    metadata: { subDiscipline: 'biophysics', tags: ['Deep Learning', 'Protein Structure', 'AlphaFold', 'Drug Discovery'], authors: ['Jumper, J.', 'Hassabis, D.'], year: 2024, abstract: 'A review of deep learning methods for protein structure prediction, from AlphaFold2 to next-generation approaches, and their applications in drug discovery.' },
  },
  {
    title: 'Synthetic Biology Design Principles for Engineered Biological Systems',
    content: `## Engineering Biology\n\nSynthetic biology applies engineering principles to design and construct new biological parts, devices, and systems.\n\n## Design-Build-Test-Learn (DBTL) Cycle\n\n### Design\n- Computational modeling of genetic circuits\n- DNA sequence optimization\n\n### Build\n- DNA assembly methods (Gibson, Golden Gate)\n- Automated clone construction\n\n### Test\n- High-throughput screening\n- Flow cytometry analysis\n\n### Learn\n- Machine learning model refinement\n- Design rule extraction\n\n## Core Biological Parts\n\n### Promoters\n- Constitutive vs. inducible\n- Strength characterization\n\n### Ribosome Binding Sites\n- Translation initiation control\n\n## Applications\n\n### Metabolic Engineering\n- Biosynthesis of high-value compounds\n- Artemisinin production in yeast\n\n### Biosensors\n- Whole-cell biosensors\n- CRISPR-based detection (SHERLOCK, DETECTR)\n\n### Cell Therapy\n- CAR-T cell engineering\n- Regulatory T cell therapy`,
    source: 'wiki',
    discipline: 'biology',
    viewCount: 87,
    metadata: { subDiscipline: 'synthetic-biology', tags: ['Synthetic Biology', 'Genetic Circuits', 'Metabolic Engineering', 'Biosensors'], authors: ['Endy, D.', 'Canton, B.'], year: 2024, abstract: 'An introduction to synthetic biology design principles, covering the DBTL cycle, core biological parts, and applications.' },
  },
  {
    title: 'Neural Dynamics and Computation in Biological Neural Networks',
    content: `## From Neurons to Networks\n\nUnderstanding how neural circuits process information requires bridging single-neuron biophysics with network-level computation.\n\n## Single-Neuron Properties\n\n### Hodgkin-Huxley Model\nThe classic model of action potential generation:\n- Voltage-gated Na+ and K+ channels\n- Threshold and refractory dynamics\n\n### Integrate-and-Fire Models\n- Leaky integrate-and-fire (LIF)\n- Adaptive exponential (AdEx)\n\n## Synaptic Dynamics\n\n### Short-Term Plasticity\n- **Facilitation**: Increased release probability\n- **Depression**: Depletion of vesicle pools\n\n### Long-Term Plasticity\n- **STDP**: Spike-Timing-Dependent Plasticity\n- **LTP/LTD**: NMDA receptor-dependent mechanisms\n\n## Network Computation\n\n### Attractor Dynamics\n- Persistent activity for working memory\n- Decision-making circuits\n\n### Balanced Networks\n- Excitation-inhibition balance\n- Rate coding and temporal coding\n\n## Experimental Techniques\n\n- **Two-photon calcium imaging**: Population recording\n- **Patch-clamp**: Single-neuron precision\n- **Optogenetics**: Causal manipulation\n- **Neuropixels**: Large-scale recording`,
    source: 'paper',
    discipline: 'biology',
    viewCount: 156,
    metadata: { subDiscipline: 'neuroscience', tags: ['Neuroscience', 'Neural Networks', 'Computational Biology', 'Theoretical Derivation'], authors: ['Dayan, P.', 'Abbott, L.F.'], year: 2024, abstract: 'A review of neural dynamics and computation in biological networks, covering single-neuron models, synaptic plasticity, and network computation.' },
  },
  {
    title: 'Single-Cell RNA Sequencing: Methods and Applications in Biomedical Research',
    content: `## The Single-Cell Revolution\n\nSingle-cell RNA sequencing (scRNA-seq) has transformed our understanding of cellular heterogeneity.\n\n## Core Technologies\n\n### Droplet-Based Methods\n- **10x Genomics Chromium**: GEM technology\n- **Drop-seq**: Nanoliter droplets\n- Throughput: 10,000+ cells per experiment\n\n### Spatial Transcriptomics\n- **10x Visium**: Tissue sections with spatial barcoding\n- **MERFISH**: Multiplexed error-robust FISH\n\n## Computational Analysis Pipeline\n\n### Preprocessing\n- Quality control and filtering\n- Doublet detection\n- Batch correction (Harmony, Seurat CCA)\n\n### Dimensionality Reduction\n- PCA for initial compression\n- UMAP for visualization\n- Diffusion maps for trajectory inference\n\n### Clustering and Annotation\n- Graph-based clustering (Louvain, Leiden)\n- Automated cell type annotation\n\n## Applications\n\n### Cancer Biology\n- Tumor microenvironment characterization\n- Cancer stem cell identification\n\n### Developmental Biology\n- Cell fate mapping\n- Organogenesis studies\n\n### Immunology\n- Immune cell atlas construction\n- Vaccine response profiling`,
    source: 'publication',
    discipline: 'biology',
    viewCount: 178,
    metadata: { subDiscipline: 'biomedical-science', tags: ['Single-Cell Sequencing', 'Transcriptomics', 'Computational Biology', 'Cancer Biology'], authors: ['Papalexi, E.', 'Satija, R.'], year: 2024, abstract: 'A review of single-cell RNA sequencing technologies, computational analysis methods, and applications in cancer biology and immunology.' },
  },
  {
    title: 'Convex Optimization Methods for Large-Scale Machine Learning',
    content: `## Foundations of Convex Optimization\n\nConvex optimization provides the mathematical foundation for many machine learning algorithms.\n\n## Key Concepts\n\n### Convex Sets and Functions\n- A set C is convex if line segment connecting any two points lies in C\n- A function f is convex if f(theta*x + (1-theta)*y) <= theta*f(x) + (1-theta)*f(y)\n\n### Lagrangian Duality\n- Primal problem: minimize f(x) subject to constraints\n- Dual problem: maximize the Lagrangian dual function\n\n## Optimization Algorithms\n\n### First-Order Methods\n- **Gradient Descent**: Simple but slow for ill-conditioned problems\n- **SGD**: Efficient for large datasets\n- **Mini-batch SGD**: Trade-off between variance and computation\n\n### Accelerated Methods\n- **Nesterov Accelerated Gradient**: O(1/t^2) convergence\n- **Momentum methods**: Heavy-ball and Nesterov momentum\n\n### Proximal Methods\n- **Proximal Gradient Descent**: Forward-backward splitting\n- **ADMM**: Distributed optimization\n- **FISTA**: Fast iterative shrinkage-thresholding\n\n### Second-Order Methods\n- **Newton's Method**: Quadratic convergence\n- **Quasi-Newton** (L-BFGS): Approximate Hessian\n\n## Applications in ML\n\n### Support Vector Machines\n- Quadratic programming formulation\n- Kernel methods for nonlinearity\n\n### Logistic Regression\n- Convex negative log-likelihood\n- Regularization for feature selection\n\n### Neural Network Training\n- Non-convex landscape challenges\n- Saddle point escape via noise`,
    source: 'paper',
    discipline: 'mathematics',
    viewCount: 145,
    metadata: { subDiscipline: 'optimization', tags: ['Optimization', 'Machine Learning', 'Convex Analysis', 'Gradient Descent'], authors: ['Boyd, S.', 'Vandenberghe, L.'], year: 2024, abstract: 'A review of convex optimization methods for machine learning, covering first-order, accelerated, proximal, and second-order methods.' },
  },
  {
    title: 'Numerical Methods for Partial Differential Equations in Scientific Computing',
    content: `## Introduction to PDE Numerics\n\nPartial differential equations govern most physical phenomena, and their numerical solution is essential for scientific computing.\n\n## Classification of PDEs\n\n### Elliptic Equations\n- Poisson equation: grad^2(u) = f\n- Laplace equation: grad^2(u) = 0\n\n### Parabolic Equations\n- Heat equation: du/dt = alpha*grad^2(u)\n\n### Hyperbolic Equations\n- Wave equation: d^2u/dt^2 = c^2*grad^2(u)\n\n## Finite Difference Methods\n\n### Discretization\n- Spatial grids: uniform and non-uniform\n- Time stepping: explicit vs. implicit\n\n### Stability Analysis\n- **Von Neumann stability analysis**\n- **CFL condition**: For hyperbolic equations\n\n## Finite Element Methods\n\n### Weak Formulation\n- Galerkin method\n- Test and trial function spaces\n\n### Element Types\n- Lagrange elements (P1, P2, P3)\n- Hermite elements (C1 continuity)\n\n## Spectral Methods\n\n- Fourier spectral methods: global basis functions\n- Chebyshev and Legendre polynomials\n- Exponential convergence for smooth solutions\n\n## Modern Developments\n\n- **Discontinuous Galerkin (DG)**: Local conservation\n- **Reduced Order Models (ROM)**: Proper Orthogonal Decomposition\n- **Physics-Informed Neural Networks (PINNs)**: Neural networks as PDE solvers`,
    source: 'wiki',
    discipline: 'mathematics',
    viewCount: 112,
    metadata: { subDiscipline: 'computational-mathematics', tags: ['PDE', 'Finite Element', 'Numerical Methods', 'Scientific Computing'], authors: ['LeVeque, R.J.', 'Brenner, S.C.'], year: 2024, abstract: 'A guide to numerical methods for partial differential equations, covering finite difference, finite element, spectral methods, and modern developments.' },
  },
  {
    title: 'Statistical Learning Theory: Foundations and Generalization Bounds',
    content: `## The Learning Problem\n\nStatistical learning theory provides the mathematical framework for understanding when machine learning models generalize.\n\n## Probably Approximately Correct (PAC) Learning\n\n### Definitions\n- **Concept class C**: Set of possible target functions\n- **Hypothesis class H**: Set of functions the learner can represent\n- **PAC learnability**: Algorithm finds approximately correct hypothesis with high probability\n\n### Sample Complexity\nFor finite hypothesis class: m >= (1/epsilon)(ln|H| + ln(1/delta))\n\n## Rademacher Complexity\n\nMeasuring richness of a function class through expected correlation with random labels.\n\nGeneralization bound: L_D(h) <= L_S(h) + 2*R_m(H) + O(sqrt(ln(1/delta)/m))\n\n## VC Dimension\n\nMaximum number of points that can be shattered by H.\n\nExamples:\n- Linear classifiers in R^d: VC dim = d + 1\n- Neural networks: VC dim grows with parameters\n\n## Modern Extensions\n\n### Deep Learning Generalization\n- Overparameterization paradox\n- Implicit regularization of gradient descent\n- Neural tangent kernel (NTK) regime\n- PAC-Bayesian bounds\n\n### Online Learning\n- Regret minimization\n- Online gradient descent\n- Online-to-batch conversion`,
    source: 'paper',
    discipline: 'mathematics',
    viewCount: 134,
    metadata: { subDiscipline: 'statistics', tags: ['Statistical Learning', 'Generalization', 'VC Dimension', 'Rademacher Complexity'], authors: ['Vapnik, V.N.', 'Mohri, M.'], year: 2024, abstract: 'A rigorous treatment of statistical learning theory, covering PAC learning, Rademacher complexity, VC dimension, and modern extensions.' },
  },
  {
    title: 'Graph Theory and Network Analysis in the Age of Big Data',
    content: `## Graphs as Universal Structures\n\nGraphs provide a natural representation for relationships in social, biological, technological, and information systems.\n\n## Fundamental Concepts\n\n### Graph Representations\n- **Adjacency matrix**: A[i,j] = 1 if edge exists\n- **Laplacian matrix**: L = D - A\n\n### Centrality Measures\n- **Degree centrality**: Number of connections\n- **Betweenness centrality**: Shortest paths through node\n- **Eigenvector centrality**: Recursive importance\n- **PageRank**: Random walk with teleportation\n\n### Clustering and Communities\n- **Modularity**: Measure of community quality\n- **Louvain algorithm**: Greedy optimization\n- **Spectral clustering**: Eigenvectors of Laplacian\n\n## Deep Learning on Graphs\n\n### Graph Neural Networks (GNNs)\n- **GCN**: Spectral convolution approximation\n- **GAT**: Graph Attention Network\n- **GraphSAGE**: Inductive representation learning\n\n## Applications\n\n### Social Networks\n- Influence maximization\n- Link prediction\n\n### Biological Networks\n- Protein-protein interaction networks\n- Brain connectomics\n\n### Recommendation Systems\n- User-item bipartite graphs\n- Knowledge graph embeddings`,
    source: 'publication',
    discipline: 'mathematics',
    viewCount: 167,
    metadata: { subDiscipline: 'applied-mathematics', tags: ['Graph Theory', 'Network Analysis', 'Graph Neural Networks', 'Spectral Methods'], authors: ['Newman, M.E.J.', 'Kipf, T.N.'], year: 2024, abstract: 'An overview of graph theory and network analysis, covering fundamental concepts, GNNs, and applications.' },
  },
  {
    title: 'Random Matrix Theory and Its Applications in Quantum Systems',
    content: `## Introduction to Random Matrix Theory\n\nRMT studies statistical properties of matrices with random entries, revealing universal behavior across physics and mathematics.\n\n## Classical Ensembles\n\n### Gaussian Ensembles\n- **GOE**: Real symmetric matrices\n- **GUE**: Hermitian matrices\n- **GSE**: Self-dual Hermitian matrices\n\n### Wigner-Dyson Distribution\n- **Poisson** (integrable): P(s) = exp(-s)\n- **Wigner-Dyson** (chaotic): P(s) proportional to s^beta * exp(-cs^2)\n\n## Applications in Quantum Physics\n\n### Quantum Chaos\n- **Bohigas-Giannoni-Schmit conjecture**: Chaotic systems follow RMT\n\n### Many-Body Systems\n- **ETH**: Eigenstate Thermalization Hypothesis\n- Many-body localization (MBL) transition\n\n### Condensed Matter\n- Anderson localization\n- Mesoscopic conductance fluctuations\n\n## Modern Developments\n\n- **Free Probability Theory**: Addition and multiplication of random matrices\n- **Compressed Sensing**: Restricted isometry property\n- **Deep Learning**: Neural tangent kernel spectrum\n- **Number Theory**: Riemann zeta function zeros`,
    source: 'paper',
    discipline: 'mathematics',
    viewCount: 89,
    metadata: { subDiscipline: 'applied-mathematics', tags: ['Random Matrix Theory', 'Quantum Chaos', 'Spectral Statistics', 'Theoretical Derivation'], authors: ['Mehta, M.L.', 'Tao, T.'], year: 2024, abstract: 'A review of random matrix theory and its applications in quantum chaos, many-body systems, and modern developments.' },
  },
  {
    title: 'Silicon Photonics for Optical Communication Systems',
    content: `## Silicon Photonics Overview\n\nSilicon photonics integrates optical components on silicon substrates, enabling high-bandwidth, energy-efficient communication.\n\n## Platform Technology\n\n### Silicon-on-Insulator (SOI)\n- High index contrast enables compact waveguides\n- CMOS-compatible fabrication\n\n### Key Components\n- **Waveguides**: Strip and rib geometries\n- **Modulators**: Carrier depletion/injection\n- **Detectors**: Germanium on silicon\n\n## Modulation Technologies\n\n- **Mach-Zehnder interferometers**: Amplitude modulation\n- **Microring resonators**: Compact, wavelength-selective\n- **Thermo-optic**: Slow but efficient\n\n## Applications\n\n### Data Center Interconnects\n- 400G/800G optical transceivers\n- Co-packaged optics for AI clusters\n\n### Sensing\n- Silicon photonic biosensors\n- LIDAR for autonomous vehicles\n\n## Challenges\n\n- Silicon's indirect bandgap (no native laser)\n- Thermal crosstalk in dense integration\n- Fiber-to-chip coupling efficiency`,
    source: 'publication',
    discipline: 'engineering',
    viewCount: 198,
    metadata: { subDiscipline: 'optical-engineering', tags: ['Silicon Photonics', 'Optical Communication', 'Integrated Photonics', 'Modulator'], authors: ['Reed, G.T.', 'Moss, D.J.'], year: 2024, abstract: 'A review of silicon photonics technology for optical communication systems, covering platform technology and applications.' },
  },
  {
    title: 'Power Electronics and Renewable Energy System Integration',
    content: `## Power Electronics Fundamentals\n\nPower electronics enables efficient conversion and control of electrical power for renewable energy integration.\n\n## Converter Topologies\n\n### DC-DC Converters\n- **Buck**: Step-down voltage\n- **Boost**: Step-up voltage\n- **Resonant converters**: Soft switching\n\n### DC-AC Inverters\n- **VSI**: Most common\n- **Multilevel inverters**: NPC, flying capacitor\n\n## Wide Bandgap Semiconductors\n\n### Silicon Carbide (SiC)\n- Higher breakdown voltage\n- Lower switching losses\n- Higher temperature operation\n\n### Gallium Nitride (GaN)\n- Very high switching frequency (>1 MHz)\n- Low gate charge\n\n## Renewable Energy Applications\n\n### Photovoltaic Systems\n- MPPT (Maximum Power Point Tracking)\n- Central, string, and micro-inverters\n\n### Wind Energy\n- Doubly-fed induction generators\n- Full converter synchronous generators\n\n### Energy Storage\n- Battery management systems (BMS)\n- Bidirectional converters\n\n## Grid Integration Challenges\n\n- Inertia reduction with high renewable penetration\n- Virtual synchronous generators (VSG)\n- Grid-forming inverters`,
    source: 'publication',
    discipline: 'engineering',
    viewCount: 154,
    metadata: { subDiscipline: 'energy-engineering', tags: ['Power Electronics', 'Renewable Energy', 'SiC', 'GaN', 'Grid Integration'], authors: ['Erickson, R.W.', 'Maksimovic, D.'], year: 2024, abstract: 'A review of power electronics for renewable energy systems, covering converter topologies and grid integration.' },
  },
  {
    title: 'Robotics Control Theory: From Classical to Learning-Based Approaches',
    content: `## Robotics Control Fundamentals\n\nControlling robotic systems requires integrating mechanical design, sensors, actuators, and intelligent algorithms.\n\n## Classical Control Methods\n\n### Rigid Body Dynamics\n- Euler-Lagrange equations\n- Newton-Euler formulation\n\n### Joint-Space Control\n- **PID control**: Simple but effective\n- **Computed torque control**: Model-based feedforward\n- **Impedance control**: Interaction with environment\n\n### Operational Space Control\n- Task-space dynamics\n- Null-space projection for redundancy\n\n## Learning-Based Control\n\n### Model Learning\n- Gaussian process dynamics models\n- Neural network system identification\n\n### Reinforcement Learning for Robotics\n- **PPO, SAC**: Actor-critic methods\n- **Model-based RL**: MPC with learned models\n\n### Imitation Learning\n- Behavioral cloning\n- DAgger (Dataset Aggregation)\n\n## Motion Planning\n\n### Sampling-Based Methods\n- **RRT**: Rapidly-exploring Random Trees\n- **RRT***: Asymptotically optimal\n\n### Optimization-Based Methods\n- TrajOpt: Sequential convex optimization\n- GPMP2: Gaussian process motion planning\n\n## Applications\n\n- Industrial robotics: Precision assembly\n- Mobile robotics: Autonomous navigation\n- Legged robots: Quadruped locomotion`,
    source: 'wiki',
    discipline: 'engineering',
    viewCount: 176,
    metadata: { subDiscipline: 'mechanical-engineering', tags: ['Robotics', 'Control Theory', 'Reinforcement Learning', 'Motion Planning'], authors: ['Siciliano, B.', 'Khatib, O.'], year: 2024, abstract: 'An overview of robotics control theory, from classical methods to learning-based approaches.' },
  },
  {
    title: 'CMOS Image Sensor Design: From Pixels to System-on-Chip',
    content: `## Image Sensor Fundamentals\n\nCMOS image sensors have become ubiquitous in digital cameras, smartphones, automotive systems, and scientific instruments.\n\n## Pixel Architectures\n\n### 4T Pinned Photodiode (PPD)\n- Transfer gate for correlated double sampling (CDS)\n- Low noise, high conversion gain\n- Industry standard\n\n### Advanced Pixel Structures\n- **5T/6T pixels**: Global shutter capability\n- **Dual conversion gain**: Wide dynamic range\n\n## Performance Metrics\n\n### Quantum Efficiency (QE)\n- Front-side illuminated: ~50% peak QE\n- Back-side illuminated: >90% peak QE\n\n### Noise Sources\n- **Photon shot noise**: sqrt(N) statistical limit\n- **Read noise**: Amplifier and ADC contributions\n- **Dark current**: Thermal generation\n\n## Digital Processing\n\n### Image Signal Processor (ISP) Pipeline\n- Black level correction\n- Demosaicing (Bayer pattern)\n- Color correction matrix\n- Noise reduction and sharpening\n\n### Computational Photography\n- Multi-frame noise reduction\n- HDR merging\n- Super-resolution\n\n## Emerging Technologies\n\n- **Event-Based Vision**: Dynamic Vision Sensor (DVS)\n- **SPAD Arrays**: Single-photon avalanche diodes\n- **Neuromorphic Sensors**: Retinomorphic processing`,
    source: 'publication',
    discipline: 'engineering',
    viewCount: 143,
    metadata: { subDiscipline: 'electronic-engineering', tags: ['CMOS', 'Image Sensor', 'ISP', 'Computational Photography'], authors: ['Fossum, E.R.', 'Nakamura, J.'], year: 2024, abstract: 'A review of CMOS image sensor design, covering pixel architectures, performance metrics, digital processing, and emerging technologies.' },
  },
  {
    title: 'Autonomous Vehicle Perception: Sensor Fusion and Deep Learning',
    content: `## Perception in Autonomous Driving\n\nReliable environmental perception is the foundation of autonomous vehicle safety.\n\n## Sensor Modalities\n\n### Cameras\n- **Monocular**: Depth estimation challenges\n- **Stereo**: Triangulation-based depth\n- **Fisheye**: 360 degree surround view\n\n### LiDAR\n- Time-of-flight distance measurement\n- 3D point cloud generation\n\n### Radar\n- Doppler velocity measurement\n- All-weather operation\n\n## Object Detection\n\n### 2D Detection\n- **YOLO**: Real-time single-shot detection\n- **DETR**: Transformer-based end-to-end\n\n### 3D Detection\n- **Point-based**: PointNet++, Point-RCNN\n- **BEV**: BEVFusion, BEVFormer\n\n### BEV Representation\n- Unified 2D representation from multiple sensors\n- Temporal fusion for moving objects\n\n## Sensor Fusion Strategies\n\n- **Early Fusion**: Raw data concatenation\n- **Late Fusion**: Decision-level combination\n- **Middle Fusion**: Feature-level combination (BEVFusion)\n\n## Challenges\n\n- Adverse weather (rain, snow, fog)\n- Occlusion and truncation\n- Long-tail distribution of rare objects\n- Real-time constraints (10-30 Hz)`,
    source: 'paper',
    discipline: 'engineering',
    viewCount: 267,
    metadata: { subDiscipline: 'electronic-engineering', tags: ['Autonomous Driving', 'Sensor Fusion', 'Deep Learning', 'LiDAR', 'Computer Vision'], authors: ['Geiger, A.', 'Liao, B.'], year: 2024, abstract: 'A review of autonomous vehicle perception, covering sensor modalities, 2D/3D detection, and fusion strategies.' },
  },
  {
    title: 'Distributed Systems Consensus: From Paxos to Blockchain',
    content: `## The Consensus Problem\n\nConsensus is the fundamental problem of making multiple distributed nodes agree on a single value.\n\n## Classical Consensus\n\n### Paxos\n- **Proposers**: Suggest values\n- **Acceptors**: Vote on values\n- **Learners**: Learn chosen value\n- Two-phase protocol: prepare and accept\n\n### Raft\n- Designed for understandability\n- **Leader election**: Term-based voting\n- **Log replication**: Append entries\n\n## Byzantine Fault Tolerance\n\n### PBFT (Practical Byzantine Fault Tolerance)\n- Pre-prepare, prepare, commit phases\n- Requires 3f+1 nodes for f Byzantine faults\n\n### HotStuff\n- Linear communication in happy path\n- Chained BFT for pipelining\n\n## Blockchain Consensus\n\n- **Proof of Work**: Computational puzzle (Bitcoin)\n- **Proof of Stake**: Validator selection by stake (Ethereum 2.0)\n- **DAG-Based**: IOTA Tangle, Hashgraph\n\n## CAP Theorem\n\n- **Consistency**: All nodes see same data\n- **Availability**: Every request gets response\n- **Partition tolerance**: System works despite network splits\n- Impossibility of all three simultaneously`,
    source: 'wiki',
    discipline: 'computer-science',
    viewCount: 198,
    metadata: { subDiscipline: 'systems', tags: ['Distributed Systems', 'Consensus', 'Blockchain', 'Byzantine Fault Tolerance'], authors: ['Lamport, L.', 'Ongaro, D.'], year: 2024, abstract: 'An overview of distributed systems consensus algorithms, from Paxos and Raft to Byzantine fault tolerance and blockchain.' },
  },
  {
    title: 'Modern Database Index Structures: From B-Trees to Learned Indexes',
    content: `## Index Structures Overview\n\nDatabase indexes are essential for efficient query processing.\n\n## Classic Index Structures\n\n### B-Trees and B+ Trees\n- Balanced tree structure\n- O(log n) lookup, insert, delete\n- B+ trees: data only in leaves, linked for range scans\n\n### Hash Indexes\n- O(1) average lookup\n- Static vs. dynamic hashing\n\n### LSM Trees\n- Write-optimized for SSDs\n- Tiered vs. leveled compaction\n- Used in RocksDB, Cassandra\n\n## Learned Indexes\n\n### The Core Idea\nReplace traditional index structures with ML models that learn the CDF of the data.\n\n### Recursive Model Index (RMI)\n- Hierarchical model structure\n- Root model selects sub-model\n- Leaf models predict position\n\n### Trade-offs\n- Training cost vs. inference speed\n- Update handling with delta indexes\n- Best for sorted data distributions\n\n## Hardware-Aware Design\n\n- Cache-conscious indexes\n- GPU-accelerated traversal\n- Persistent memory indexes`,
    source: 'publication',
    discipline: 'computer-science',
    viewCount: 156,
    metadata: { subDiscipline: 'databases', tags: ['Database', 'Index Structures', 'Learned Indexes', 'B-Tree'], authors: ['Krishnan, S.', 'Galakatos, A.'], year: 2024, abstract: 'A review of database index structures, from classic B-trees to modern learned indexes and hardware-aware designs.' },
  },
  {
    title: 'Network Protocol Security: From TLS to Post-Quantum Cryptography',
    content: `## Network Security Fundamentals\n\nSecuring network communications requires cryptographic protocols providing confidentiality, integrity, and authenticity.\n\n## Transport Layer Security (TLS)\n\n### TLS 1.3\n- Simplified handshake (1-RTT, 0-RTT resumption)\n- Forward secrecy by default\n- Removed obsolete algorithms\n\n### Certificate Infrastructure\n- X.509 certificates and chains\n- Certificate Transparency (CT) logs\n- Let's Encrypt and ACME protocol\n\n## Quantum Threat\n\n### Shor's Algorithm\n- Polynomial-time integer factorization\n- Breaks RSA and ECC\n\n### Grover's Algorithm\n- Quadratic speedup for search\n- Halves effective symmetric key strength\n\n## Post-Quantum Cryptography (PQC)\n\n### NIST Standardization\n- **CRYSTALS-Kyber**: Lattice-based key encapsulation\n- **CRYSTALS-Dilithium**: Lattice-based signatures\n- **SPHINCS+**: Hash-based signatures\n\n### Lattice-Based Cryptography\n- Learning With Errors (LWE) problem\n- Ring-LWE for efficiency\n\n## Application Layer Security\n\n- DNS Security: DNSSEC, DoH, DoT\n- Email Security: DKIM, DMARC\n- Secure Messaging: Signal Protocol\n\n## Emerging Threats\n\n- Side-channel attacks (timing, cache)\n- Protocol attacks (downgrade, Bleichenbacher)\n- Zero-Trust Networking with mTLS`,
    source: 'wiki',
    discipline: 'computer-science',
    viewCount: 187,
    metadata: { subDiscipline: 'networks', tags: ['Network Security', 'TLS', 'Post-Quantum Cryptography', 'Cryptography'], authors: ['Rescorla, E.', 'Bernstein, D.J.'], year: 2024, abstract: 'An overview of network protocol security, covering TLS 1.3, post-quantum cryptography standardization, and emerging threats.' },
  },
  {
    title: 'Compiler Optimization Techniques for Modern Hardware',
    content: `## Compiler Architecture\n\nModern compilers bridge the gap between high-level languages and complex hardware targets.\n\n## Intermediate Representations\n\n- **SSA Form**: Static Single Assignment\n- **Three-Address Code**: Simple register-like operations\n- **Sea of Nodes**: Graph-based representation\n\n## Optimization Categories\n\n### Local Optimizations\n- Constant folding\n- Strength reduction\n- Common subexpression elimination\n\n### Loop Optimizations\n- Loop unrolling, fusion, tiling\n- Loop interchange\n- Polyhedral optimization\n\n### Memory Optimizations\n- Alias analysis\n- Cache optimizations\n- Data layout transformations\n\n## Vectorization\n\n- Auto-vectorization (SLP, loop vectorization)\n- SIMD instruction sets (AVX-512, NEON, SVE)\n\n## Register Allocation\n\n- Graph coloring (Chaitin-Briggs)\n- Linear scan for JIT compilers\n\n## Modern Challenges\n\n- Profile-guided optimization (PGO)\n- Link-time optimization (LTO)\n- Just-in-time compilation\n- GPU and TPU compilation`,
    source: 'publication',
    discipline: 'computer-science',
    viewCount: 134,
    metadata: { subDiscipline: 'software-engineering', tags: ['Compiler', 'Optimization', 'LLVM', 'Vectorization', 'Code Generation'], authors: ['Muchnick, S.S.', 'Cooper, K.D.'], year: 2024, abstract: 'A review of compiler optimization techniques, covering IRs, loop optimizations, vectorization, and modern challenges.' },
  },
  {
    title: 'Approximation Algorithms for NP-Hard Combinatorial Problems',
    content: `## Complexity and Approximation\n\nWhen problems are NP-hard, approximation algorithms provide provably near-optimal solutions efficiently.\n\n## Approximation Metrics\n\n- **Approximation ratio**: ALG/OPT <= alpha\n- **PTAS**: (1+epsilon)-approximation for any epsilon > 0\n- **APX-hard**: No PTAS unless P = NP\n\n## Classic Problems\n\n### Vertex Cover\n- Greedy 2-approximation\n- LP rounding: 2-approximation\n\n### Set Cover\n- Greedy: O(log n)-approximation (optimal)\n\n### Metric TSP\n- Christofides' 1.5-approximation\n\n### Maximum Cut\n- Goemans-Williamson: 0.878-approximation via SDP\n\n## Advanced Techniques\n\n- **Linear Programming Relaxations**\n- **Semidefinite Programming**\n- **Primal-Dual Methods**\n- **Local Search**\n\n## Modern Developments\n\n- **Submodular Optimization**: (1-1/e)-approximation\n- **Spectral Methods**: Cheeger inequality\n- **Sum-of-Squares Hierarchy**`,
    source: 'paper',
    discipline: 'computer-science',
    viewCount: 112,
    metadata: { subDiscipline: 'algorithms', tags: ['Approximation Algorithms', 'NP-Hard', 'Combinatorial Optimization', 'Linear Programming'], authors: ['Vazirani, V.V.', 'Williamson, D.P.'], year: 2024, abstract: 'A review of approximation algorithms for NP-hard problems, covering classic problems, LP/SDP relaxations, and modern developments.' },
  },
  {
    title: 'Deep Learning in Medical Image Analysis: From Detection to Diagnosis',
    content: `## AI in Medical Imaging\n\nDeep learning has achieved remarkable success in medical image analysis.\n\n## Core Architectures\n\n- **U-Net**: Encoder-decoder with skip connections\n- **ResNet**: Skip connections for deep networks\n- **Vision Transformers**: ViT, Swin Transformer\n\n## Medical Imaging Modalities\n\n### Radiography (X-ray)\n- Chest X-ray: Pneumonia, COVID-19 detection\n- Mammography: Breast cancer screening\n\n### Computed Tomography (CT)\n- Lung nodule detection\n- Liver lesion segmentation\n\n### Magnetic Resonance Imaging (MRI)\n- Brain tumor segmentation (BraTS)\n- Cardiac function analysis\n\n### Pathology\n- Whole slide image (WSI) analysis\n- Cancer grading\n\n## Key Tasks\n\n- Detection, segmentation, classification\n- Registration and motion correction\n\n## Challenges\n\n- Data scarcity and annotation cost\n- Domain shift across scanners\n- Explainability and regulatory approval\n\n## Emerging Directions\n\n- Foundation models for medical imaging\n- Multimodal learning (imaging + genomics)\n- Self-supervised and contrastive learning`,
    source: 'publication',
    discipline: 'medicine',
    viewCount: 245,
    metadata: { subDiscipline: 'medical-imaging', tags: ['Deep Learning', 'Medical Imaging', 'U-Net', 'Computer Vision', 'Diagnostics'], authors: ['Litjens, G.', 'Shen, D.'], year: 2024, abstract: 'A review of deep learning in medical image analysis, covering architectures, modalities, tasks, and challenges.' },
  },
  {
    title: 'Cancer Immunotherapy: CAR-T Cells, Checkpoint Inhibitors, and Beyond',
    content: `## The Immune System and Cancer\n\nThe immune system naturally recognizes cancer cells, but tumors develop evasion mechanisms.\n\n## Immune Checkpoint Inhibitors\n\n### CTLA-4 Pathway\n- **Ipilimumab**: First approved checkpoint inhibitor\n\n### PD-1/PD-L1 Pathway\n- **Anti-PD-1**: Pembrolizumab, Nivolumab\n- **Anti-PD-L1**: Atezolizumab\n- Biomarker: PD-L1 expression, TMB\n\n## CAR-T Cell Therapy\n\n### CAR Structure\n- ScFv for antigen recognition\n- Costimulatory domains (CD28, 4-1BB)\n\n### Manufacturing\n1. Leukapheresis\n2. Activation and transduction\n3. Expansion and infusion\n\n### Approved Therapies\n- CD19 CAR-T for B-cell malignancies\n- BCMA CAR-T for multiple myeloma\n\n## Challenges\n\n- Cytokine Release Syndrome (CRS)\n- Neurotoxicity (ICANS)\n- Antigen escape\n- Manufacturing cost and time\n\n## Future Directions\n\n- Allogeneic (off-the-shelf) CAR-T\n- Solid tumor CAR-T\n- CAR-NK and CAR-Macrophage`,
    source: 'publication',
    discipline: 'medicine',
    viewCount: 198,
    metadata: { subDiscipline: 'biomedical', tags: ['Immunotherapy', 'CAR-T', 'Cancer', 'Checkpoint Inhibitors', 'Oncology'], authors: ['June, C.H.', 'Rosenberg, S.A.'], year: 2024, abstract: 'A review of cancer immunotherapy, covering checkpoint inhibitors, CAR-T therapy, and future directions.' },
  },
  {
    title: 'AI-Driven Drug Discovery: From Molecular Screening to Clinical Candidates',
    content: `## The Drug Discovery Challenge\n\nDeveloping new drugs costs ~$2.6 billion over 10-15 years. AI promises to accelerate this process.\n\n## Target Identification\n\n- Multi-omics integration (genomics, transcriptomics)\n- Knowledge graphs for drug-target-disease relationships\n\n## Hit Discovery\n\n### Virtual Screening\n- Molecular docking\n- ML scoring functions\n\n### Generative Models\n- VAEs, GANs, Flow models\n- Diffusion models for molecule generation\n- Reinforcement learning for optimization\n\n## Lead Optimization\n\n### ADMET Prediction\n- Absorption, Distribution, Metabolism, Excretion, Toxicity\n- Multi-objective optimization\n\n## Clinical Trial Optimization\n\n- Patient stratification\n- Synthetic control arms\n- Real-world evidence integration\n\n## Success Stories\n\n- AlphaFold for structure-based design\n- Atomwise: Ebola drug repurposing (26 days)\n- Insilico Medicine: Novel target in 18 months\n\n## Challenges\n\n- Data quality and bias\n- In vitro to in vivo translation\n- Regulatory pathways for AI-discovered drugs`,
    source: 'paper',
    discipline: 'medicine',
    viewCount: 267,
    metadata: { subDiscipline: 'drug-discovery', tags: ['AI', 'Drug Discovery', 'Generative Models', 'Virtual Screening', 'ADMET'], authors: ['Stokes, J.M.', 'Zhavoronkov, A.'], year: 2024, abstract: 'A review of AI-driven drug discovery, covering target identification, generative models, lead optimization, and clinical applications.' },
  },
  {
    title: 'Causal Inference Methods in Modern Econometrics',
    content: `## From Correlation to Causation\n\nEconometrics aims to identify causal relationships from observational data.\n\n## Potential Outcomes Framework\n\n### Average Treatment Effect (ATE)\n- ATE = E[Y(1) - Y(0)]\n- Fundamental problem: never observe both outcomes\n\n## Quasi-Experimental Methods\n\n### Regression Discontinuity (RD)\n- Treatment assigned based on cutoff\n- Local average treatment effect at cutoff\n\n### Instrumental Variables (IV)\n- Two-stage least squares (2SLS)\n- LATE interpretation\n\n### Difference-in-Differences (DiD)\n- Parallel trends assumption\n- Staggered treatment adoption\n\n### Synthetic Control\n- Weighted combination of control units\n- Placebo inference\n\n## Machine Learning for Causal Inference\n\n- **Causal Forests**: Heterogeneous treatment effects\n- **Double ML**: Neyman-orthogonal scores\n- **Meta-Learners**: S-learner, T-learner, X-learner\n\n## Applications\n\n- Labor economics: Minimum wage effects\n- Development economics: RCTs in developing countries\n- Policy evaluation: Medicaid expansion`,
    source: 'paper',
    discipline: 'economics',
    viewCount: 156,
    metadata: { subDiscipline: 'econometrics', tags: ['Causal Inference', 'Econometrics', 'Difference-in-Differences', 'Instrumental Variables'], authors: ['Imbens, G.W.', 'Rubin, D.B.'], year: 2024, abstract: 'A review of causal inference methods in econometrics, covering quasi-experimental methods and ML approaches.' },
  },
  {
    title: 'Algorithmic Trading and Market Microstructure in Modern Financial Markets',
    content: `## Electronic Trading Evolution\n\nFinancial markets have been transformed by electronic trading, with algorithms executing the majority of trades.\n\n## Market Microstructure Fundamentals\n\n### Order-Driven Markets\n- **Limit order book**: Bid and ask queues\n- **Price priority**: Best price first\n- **Market orders**: Immediate execution\n\n### Market Making\n- Continuous quoting of bid and ask\n- Profit from bid-ask spread\n- Inventory risk management\n\n## Algorithmic Trading Strategies\n\n### Execution Algorithms\n- **VWAP**: Volume-Weighted Average Price\n- **TWAP**: Time-Weighted Average Price\n- **Implementation Shortfall**: Minimize deviation\n\n### High-Frequency Trading (HFT)\n- Latency arbitrage across venues\n- Market making with microsecond updates\n\n## Machine Learning in Trading\n\n- Order book feature engineering\n- LSTM/GRU for time series prediction\n- Reinforcement learning for optimal execution\n\n## Regulatory Landscape\n\n- Market abuse detection (spoofing, layering)\n- Flash crash prevention (circuit breakers)\n- MiFID II and Reg NMS compliance`,
    source: 'publication',
    discipline: 'economics',
    viewCount: 178,
    metadata: { subDiscipline: 'financial-engineering', tags: ['Algorithmic Trading', 'Market Microstructure', 'High-Frequency Trading', 'Machine Learning'], authors: ['Hasbrouck, J.', "O'Hara, M."], year: 2024, abstract: 'A review of algorithmic trading and market microstructure, covering execution algorithms, HFT, and regulatory landscape.' },
  },
  {
    title: 'Climate Modeling and Carbon Cycle Dynamics in the Anthropocene',
    content: `## Earth System Modeling\n\nClimate models are essential tools for understanding past climate variations and projecting future changes.\n\n## Model Hierarchy\n\n### Energy Balance Models (EBM)\n- Simple 0D or 1D models\n- Climate sensitivity parameter\n\n### General Circulation Models (GCM)\n- 3D atmosphere and ocean dynamics\n- Navier-Stokes on rotating sphere\n\n### Earth System Models (ESM)\n- Coupled atmosphere-ocean-land-ice-carbon\n- Biogeochemical cycles\n\n## Carbon Cycle Components\n\n### Atmosphere\n- CO2 concentration: ~421 ppm (2024)\n- Growth rate: ~2.5 ppm/year\n\n### Ocean Carbon Uptake\n- Solubility pump\n- Biological pump\n- Ocean acidification\n\n### Terrestrial Biosphere\n- Photosynthesis and respiration\n- Permafrost carbon vulnerability\n\n### Feedbacks\n- Carbon-climate feedback\n- Permafrost feedback\n\n## Machine Learning in Climate Science\n\n- Surrogate models for expensive ESMs\n- Extreme event detection\n- Statistical downscaling\n\n## Policy Relevance\n\n- IPCC Assessment Reports\n- Net zero pathways\n- Carbon dioxide removal (CDR) technologies`,
    source: 'publication',
    discipline: 'earth-sciences',
    viewCount: 134,
    metadata: { subDiscipline: 'atmospheric', tags: ['Climate Modeling', 'Carbon Cycle', 'Earth System Model', 'Global Warming'], authors: ['Stocker, T.F.', 'IPCC'], year: 2024, abstract: 'A review of climate modeling and carbon cycle dynamics, covering model hierarchy and policy relevance.' },
  },
  {
    title: 'Machine Learning in Geophysical Data Analysis: Seismic Imaging and Inversion',
    content: `## Geophysical Exploration\n\nGeophysical methods probe Earth's interior using seismic waves and electromagnetic fields.\n\n## Seismic Imaging\n\n### Migration Methods\n- **Kirchhoff migration**: Ray-based\n- **Reverse Time Migration (RTM)**: Two-way wave equation\n- **Full Waveform Inversion (FWI)**: Data fitting in data domain\n\n## Machine Learning Applications\n\n### Velocity Model Building\n- FWI with neural network parameterization\n- End-to-end velocity estimation\n\n### Seismic Interpretation\n- Horizon tracking with U-Net\n- Fault detection with 3D CNN\n- Salt body delineation\n\n### Denoising and Enhancement\n- Autoencoders for noise attenuation\n- Deep prior methods for reconstruction\n\n## Electromagnetic Methods\n\n- Controlled Source EM (CSEM)\n- Magnetotellurics (MT)\n\n## Challenges\n\n- Petabyte-scale data volumes\n- Physics constraints in ML models\n- Interpretability requirements\n\n## Future Directions\n\n- Real-time monitoring\n- Distributed Acoustic Sensing (DAS)\n- Digital twins for subsurface models`,
    source: 'paper',
    discipline: 'earth-sciences',
    viewCount: 98,
    metadata: { subDiscipline: 'geology', tags: ['Seismic Imaging', 'Machine Learning', 'Geophysics', 'Full Waveform Inversion'], authors: ['Yilmaz, O.', 'Richardson, A.'], year: 2024, abstract: 'A review of ML applications in geophysical data analysis, covering seismic imaging, electromagnetic methods, and challenges.' },
  },
  {
    title: 'Quantum Machine Learning: Bridging Quantum Computing and AI',
    content: `## The Quantum-ML Intersection\n\nQuantum machine learning explores how quantum computers can enhance ML and vice versa.\n\n## Quantum Computing Primer\n\n### Qubits\n- Superposition: alpha|0> + beta|1>\n- Entanglement: Non-local correlations\n\n### Quantum Algorithms\n- **Shor's**: Integer factorization\n- **Grover's**: Unstructured search\n- **VQE/QSVM**: Variational quantum algorithms\n\n## Quantum Machine Learning Approaches\n\n### Quantum Kernel Methods\n- Quantum feature maps\n- Quantum kernel estimation\n\n### Variational Quantum Circuits\n- **QAOA**: Quantum Approximate Optimization\n- **VQE**: Variational Quantum Eigensolver\n- Barren plateaus challenge\n\n## Classical ML for Quantum\n\n- Quantum control and pulse optimization\n- Neural decoders for quantum error correction\n- Quantum state tomography with ML\n\n## Software and Hardware\n\n- **Qiskit** (IBM), **Cirq** (Google), **PennyLane** (Xanadu)\n- Superconducting qubits, trapped ions, photonic\n\n## Challenges and Outlook\n\n- NISQ era limitations (50-1000 noisy qubits)\n- No proven practical quantum advantage yet\n- Fault-tolerant quantum computing future`,
    source: 'publication',
    discipline: 'interdisciplinary',
    viewCount: 234,
    metadata: { subDiscipline: 'computational-physics', tags: ['Quantum Computing', 'Machine Learning', 'Variational Circuits', 'Quantum Algorithms'], authors: ['Biamonte, J.', 'Preskill, J.'], year: 2024, abstract: 'A review of quantum machine learning, covering quantum algorithms, variational circuits, and hardware platforms.' },
  },
  {
    title: 'Bioinformatics Pipelines for Large-Scale Genomic Data Analysis',
    content: `## The Genomics Data Deluge\n\nModern sequencing technologies generate terabytes of genomic data requiring sophisticated computational pipelines.\n\n## Sequencing Technologies\n\n- **Illumina**: Short reads, high accuracy\n- **PacBio**: Long reads (10-25 kb)\n- **Oxford Nanopore**: Ultra-long reads, real-time\n\n## Core Analysis Pipelines\n\n### Read Alignment\n- **BWA-MEM**: Burrows-Wheeler aligner\n- **Minimap2**: Long-read alignment\n- **STAR**: Spliced alignment for RNA-seq\n\n### Variant Calling\n- **GATK**: Gold standard for germline variants\n- **DeepVariant**: CNN-based variant caller\n\n### Genome Assembly\n- **SPAdes**: De Bruijn graph assembler\n- **Canu/Flye**: Long-read assembly\n\n## RNA-Seq Analysis\n\n- Quantification: Salmon, Kallisto\n- Differential expression: DESeq2, edgeR\n- Alternative splicing: rMATS, SUPPA\n\n## Workflow Management\n\n- **Snakemake**: Python-based, rule-oriented\n- **Nextflow**: DSL for scalable pipelines\n- Containers: Docker, Singularity\n\n## Future Directions\n\n- Real-time analysis with nanopore adaptive sampling\n- Single-cell multi-omics integration\n- AI-driven variant calling and annotation`,
    source: 'wiki',
    discipline: 'interdisciplinary',
    viewCount: 187,
    metadata: { subDiscipline: 'bioinformatics', tags: ['Bioinformatics', 'Genomics', 'NGS', 'Variant Calling', 'Pipeline'], authors: ['Li, H.', 'Quinlan, A.R.'], year: 2024, abstract: 'A guide to bioinformatics pipelines for genomic data analysis, covering sequencing technologies and workflow management.' },
  },
  {
    title: 'Integrated Silicon Photonics for Artificial Intelligence Acceleration',
    content: `## The AI Compute Bottleneck\n\nTraining large AI models demands enormous computational resources. Photonic computing offers ultra-efficient acceleration.\n\n## Photonic Matrix Multiplication\n\n### Mach-Zehnder Interferometer (MZI) Mesh\n- Reconfigurable photonic circuits\n- Unitary matrix decomposition\n\n### MRR (Microring Resonator) Arrays\n- Weight banks for matrix-vector multiplication\n- Wavelength-division multiplexing\n\n## Photonic Neural Network Architectures\n\n- Coherent Optical Neural Networks\n- Diffractive Optical Networks\n- Reservoir Computing\n\n## Advantages of Photonic AI\n\n- **Speed**: THz potential\n- **Energy Efficiency**: ~1 fJ per MAC vs. ~1 pJ electronic\n- **Bandwidth**: THz optical fiber bandwidth\n\n## Challenges\n\n- Device nonidealities and insertion loss\n- Limited analog precision (~8-10 bits)\n- Electronic interface overhead\n- Packaging complexity\n\n## Experimental Demonstrations\n\n- MIT: 49-node photonic neural network\n- Lightmatter: Envise photonic accelerator\n- Intel: Optical Compute Interconnect\n\n## Future Outlook\n\n- 3D photonic integration\n- Nonlinear photonics for optical activations\n- Hybrid electronic-photonic systems\n- Edge AI with ultra-low power photonic inference`,
    source: 'paper',
    discipline: 'interdisciplinary',
    viewCount: 289,
    metadata: { subDiscipline: 'optoelectronic-integration', tags: ['Silicon Photonics', 'AI Acceleration', 'Photonic Computing', 'Neural Networks', 'Matrix Multiplication'], authors: ['Shen, Y.', 'Harris, N.C.'], year: 2024, abstract: 'A review of integrated silicon photonics for AI acceleration, covering photonic matrix multiplication and neural network architectures.' },
  },
]

async function main() {
  console.log(`Enriching knowledge base with ${DOCUMENTS.length} documents...`)

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
