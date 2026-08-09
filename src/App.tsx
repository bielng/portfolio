import {
  ArrowUpRight,
  Zap,
  Database,
  Cloud,
  HeartHandshake,
  Code2,
  Menu,
  X,
  Globe,
  Mail,
  Send,
  Github,
  Linkedin,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { BlurText } from "./components/BlurText";
import { HLSVideo } from "./components/HLSVideo";
import { ArtPiece } from "./components/ArtPiece";
import { Terminal } from "./components/Terminal";
import { cn } from "./lib/utils";

// --- Components ---

const Badge = ({
  children,
  className,
  variant = "liquid",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "liquid" | "liquid-strong";
}) => (
  <div
    className={cn(
      "rounded-full px-3.5 py-1 text-xs font-medium text-white font-body inline-block mb-4",
      variant === "liquid" ? "liquid-glass" : "liquid-glass-strong",
      className,
    )}
  >
    {children}
  </div>
);

const SectionHeading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2
    className={cn(
      "text-4xl md:text-5xl lg:text-6xl font-heading text-white tracking-tight leading-[1.1]",
      className,
    )}
  >
    {children}
  </h2>
);

const Button = ({
  children,
  variant = "liquid",
  className,
  icon: Icon,
  href,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "liquid" | "liquid-strong" | "solid";
  className?: string;
  icon?: any;
  href?: string;
  onClick?: () => void;
}) => {
  const baseStyles =
    "font-body rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 group";
  const variants = {
    liquid: "liquid-glass hover:bg-white/5",
    "liquid-strong": "liquid-glass-strong hover:bg-white/10",
    solid: "bg-white text-black hover:bg-white/90",
  };

  const content = (
    <>
      {children}
      {Icon && (
        <Icon className='w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={cn(baseStyles, variants[variant], className)}>
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(baseStyles, variants[variant], className)}
    >
      {content}
    </button>
  );
};

// --- Sections ---

const Logo = ({ className }: { className?: string }) => (
  <a href='#' className={cn("flex items-center gap-2 sm:gap-3", className)}>
    <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-2xl'>
      <span
        className='font-heading font-semibold text-black text-sm sm:text-base italic'
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        TN
      </span>
    </div>
    <div className='flex flex-col leading-none'>
      <span className='font-body font-bold text-white text-lg sm:text-xl tracking-tight'>
        Taban Ngunar
      </span>
      <span className='font-body font-light text-white/50 text-[7px] sm:text-[9px] uppercase tracking-[0.3em]'>
        Data · Cloud · Impact
      </span>
    </div>
  </a>
);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // reserved for future scroll-based nav styling
  }, []);

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "About", href: "#about" },
    { name: "Projects", href: "#projects" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav className='fixed top-4 left-0 right-0 z-50 px-4 md:px-8'>
      <div className='max-w-7xl mx-auto flex items-center justify-between'>
        <Logo />

        <div className='liquid-glass rounded-full px-2 py-1.5 flex items-center gap-1'>
          <div className='hidden md:flex items-center gap-1 px-4'>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className='text-sm font-medium text-white/70 hover:text-white px-3 py-1 transition-colors'
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className='flex items-center gap-1'>
            <Button
              variant='solid'
              icon={ArrowUpRight}
              href='#contact'
              className='hidden sm:flex'
            >
              Get in Touch
            </Button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='md:hidden w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors'
              aria-label='Toggle menu'
            >
              {isMenuOpen ? (
                <X className='w-5 h-5' />
              ) : (
                <Menu className='w-5 h-5' />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='md:hidden absolute top-20 left-4 right-4 liquid-glass rounded-3xl p-6 border border-white/10 shadow-2xl z-50'
          >
            <div className='flex flex-col gap-4'>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className='text-lg font-medium text-white/70 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all'
                >
                  {link.name}
                </a>
              ))}
              <hr className='border-white/5 my-2' />
              <Button
                variant='solid'
                icon={ArrowUpRight}
                href='#contact'
                className='w-full py-4'
              >
                Get in Touch
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className='relative min-h-screen lg:h-[1000px] w-full bg-black overflow-hidden flex flex-col items-center pt-32 md:pt-40 lg:pt-[150px]'>
      {/* Background Video */}
      <video
        src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4'
        className='absolute top-[20%] w-full h-auto object-contain z-0 opacity-80'
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlays */}
      <div className='absolute inset-0 bg-black/10 z-0' />
      <div className='absolute bottom-0 left-0 right-0 z-[1] h-[300px] bg-gradient-to-t from-black to-transparent' />

      {/* Content */}
      <div className='relative z-10 text-center px-6 max-w-5xl'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className='flex items-center gap-2'>
            <span className='bg-white text-black px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider'>
              Est. 2026
            </span>
            <span>
              Data Scientist &amp; Cloud Engineer · Refugee Tech Advocate
            </span>
          </Badge>
        </motion.div>

        <BlurText
          text='Transforming lives through data science and digital empowerment.'
          className='text-5xl md:text-6xl lg:text-7xl font-heading text-white leading-[1.1] tracking-tight mt-6'
          delay={100}
        />

        <motion.p
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className='font-body font-light text-white/60 text-lg md:text-xl max-w-2xl mx-auto mt-8'
        >
          Making data work for humanity with Python, AWS, Power BI, and
          open-source tools.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className='flex flex-col lg:flex-row items-center justify-center gap-8 mt-12'
        >
          <Button
            variant='liquid-strong'
            className='px-8 py-4 text-base'
            icon={ArrowUpRight}
            href='#projects'
          >
            View Projects
          </Button>
          <Button
            variant='liquid'
            className='px-8 py-4 text-base'
            href='#about'
          >
            About Me
          </Button>

          <div className='flex items-center gap-8'>
            <a
              href='https://github.com/bielng'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-3 text-white/80 hover:text-white font-body text-sm transition-colors group'
            >
              <div className='w-10 h-10 rounded-full liquid-glass flex items-center justify-center group-hover:bg-white/10 transition-colors'>
                <Github className='w-4 h-4' />
              </div>
              GitHub
            </a>
            <a
              href='https://www.linkedin.com/in/taban-ngunar-x217/'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-3 text-white/80 hover:text-white font-body text-sm transition-colors group'
            >
              <div className='w-10 h-10 rounded-full liquid-glass flex items-center justify-center group-hover:bg-white/10 transition-colors'>
                <Linkedin className='w-4 h-4' />
              </div>
              LinkedIn
            </a>
          </div>
        </motion.div>
      </div>

      {/* Signature strip at Hero Bottom */}
      <div className='mt-auto pb-12 pt-20 w-full max-w-7xl px-6 relative z-10'>
        <div className='flex flex-col items-center gap-8'>
          <Badge variant='liquid'>Working with</Badge>
          <div className='flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500'>
            {["Python", "AWS", "Power BI", "SQL", "Open Source"].map((tool) => (
              <span
                key={tool}
                className='text-2xl md:text-3xl font-heading text-white'
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ArtSection = () => {
  return (
    <section
      className='relative w-full h-[85vh] min-h-[560px] overflow-hidden'
      style={{ background: "#f5f5f7" }}
    >
      <ArtPiece className='absolute inset-0' />

      {/* Caption overlay — dark text since this section sits on a light background */}
      <div className='absolute top-10 left-1/2 -translate-x-1/2 z-10 text-center px-6 pointer-events-none'>
        <div className='rounded-full px-3.5 py-1 text-xs font-medium text-black/70 bg-black/5 backdrop-blur-sm inline-block mb-3 uppercase tracking-widest'>
          Digital Craft
        </div>
        <h3 className='text-black/80 font-heading text-xl md:text-2xl'>
          An interactive self-portrait
        </h3>
        <p className='text-black/40 font-body font-light text-xs md:text-sm mt-2'>
          Drag to rotate · Move your cursor to reveal what's underneath
        </p>
      </div>

      {/* Blend edges into the black sections above and below */}
      <div className='absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-[1] pointer-events-none' />
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-[1] pointer-events-none' />
    </section>
  );
};

const DataHasChanged = () => {
  return (
    <section className='relative min-h-[700px] w-full py-32 px-6 md:px-16 lg:px-24 flex items-center justify-center overflow-hidden'>
      {/* Background HLS Video */}
      <HLSVideo
        src='https://stream.mux.com/9JXDljEVWYwWu01PUkAemafDugK89o01BR6zqJ3aS9u00A.m3u8'
        className='absolute inset-0 w-full h-full object-cover z-0'
      />

      {/* Fades */}
      <div className='absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-black to-transparent z-[1]' />
      <div className='absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-black to-transparent z-[1]' />

      <div className='relative z-10 text-center max-w-3xl'>
        <Badge>My Approach</Badge>
        <SectionHeading className='mt-4'>
          Data has changed. Have you?
        </SectionHeading>
        <p className='font-body font-light text-white/60 text-lg mt-6'>
          As a Data Scientist &amp; Cloud Engineer, I help organizations and
          communities navigate the complex landscape of digital transformation
          and data-driven impact.
        </p>
        <div className='flex justify-center mt-10'>
          <Button
            variant='liquid-strong'
            className='px-8'
            icon={ArrowUpRight}
            href='#projects'
          >
            See the Work
          </Button>
        </div>
      </div>
    </section>
  );
};

const CapabilitiesChess = () => {
  return (
    <section className='py-24 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto'>
      <div className='mb-20'>
        <Badge>How I Work</Badge>
        <SectionHeading className='mt-4'>
          Solutions for impactful technology.
        </SectionHeading>
      </div>

      <div className='space-y-32'>
        {/* Row 1 */}
        <div className='flex flex-col lg:flex-row items-center gap-12 lg:gap-16'>
          <div className='flex-1 space-y-6 text-center lg:text-left'>
            <h3 className='text-3xl md:text-4xl lg:text-5xl font-heading text-white leading-tight'>
              Building Robust Data Pipelines
            </h3>
            <p className='text-white/60 font-body font-light leading-relaxed max-w-2xl mx-auto lg:mx-0'>
              I build robust data pipelines and machine learning models with
              Python, turning raw, messy data into clean, reliable foundations
              that organizations can actually trust and act on.
            </p>
            <div className='flex justify-center lg:justify-start'>
              <Button variant='liquid-strong' href='#projects'>
                Explore Projects
              </Button>
            </div>
          </div>
          <div className='flex-1 w-full max-w-3xl mx-auto'>
            <div className='liquid-glass rounded-3xl overflow-hidden aspect-[4/5] xs:aspect-square sm:aspect-video lg:aspect-[4/3] xl:aspect-video relative border border-white/10 shadow-2xl'>
              <div className='w-full h-full bg-[#050505] rounded-2xl overflow-hidden relative'>
                <img
                  src='https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop'
                  alt='Data pipeline dashboard'
                  className='w-full h-full object-cover opacity-90'
                  referrerPolicy='no-referrer'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none' />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className='flex flex-col lg:flex-row-reverse items-center gap-16'>
          <div className='flex-1 space-y-6'>
            <h3 className='text-3xl md:text-4xl font-heading text-white'>
              Architecting Scalable Cloud Solutions
            </h3>
            <p className='text-white/60 font-body font-light leading-relaxed'>
              I architect secure, scalable cloud infrastructure on AWS and
              open-source technologies — built for global impact, not just a
              single deployment.
            </p>
            <Button variant='liquid-strong' href='#about'>
              Read My Story
            </Button>
          </div>
          <div className='flex-1 w-full'>
            <div className='liquid-glass rounded-2xl overflow-hidden aspect-video relative border border-white/10 shadow-2xl group/video'>
              <video
                src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4'
                className='w-full h-full object-cover opacity-90 group-hover/video:scale-105 transition-transform duration-700'
                autoPlay
                loop
                muted
                playsInline
              />
              <div className='absolute inset-0 bg-black/40 pointer-events-none' />
              <div className='absolute inset-0 flex items-center justify-center p-8 text-center pointer-events-none'>
                <p className='text-white/90 text-sm md:text-base font-body font-light tracking-wider max-w-[80%] leading-relaxed drop-shadow-lg'>
                  Empowering Communities Through Technology
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Expertise = () => {
  const cards = [
    {
      icon: Database,
      title: "Data Science",
      description:
        "Transforming raw data into meaningful insights for social and business impact.",
    },
    {
      icon: Cloud,
      title: "Cloud Engineering",
      description:
        "Architecting secure and scalable cloud infrastructure using AWS and open-source technologies.",
    },
    {
      icon: HeartHandshake,
      title: "Refugee Tech",
      description:
        "Advocating for digital empowerment and technology access for displaced and underserved communities.",
    },
    {
      icon: Code2,
      title: "Open Source",
      description:
        "Contributing to and leveraging open-source tools to create practical humanitarian and community-focused solutions.",
    },
  ];

  return (
    <section
      id='expertise'
      className='py-24 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto'
    >
      <div className='mb-16'>
        <Badge>Expertise</Badge>
        <SectionHeading className='mt-4'>
          Solutions for impactful technology.
        </SectionHeading>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
            className='liquid-glass rounded-2xl p-8 group hover:bg-white/[0.03] transition-colors'
          >
            <div className='liquid-glass-strong rounded-full w-12 h-12 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform'>
              <card.icon className='w-5 h-5 text-white' />
            </div>
            <h4 className='text-xl font-heading text-white mb-3'>
              {card.title}
            </h4>
            <p className='text-white/60 font-body font-light text-sm leading-relaxed'>
              {card.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const About = () => {
  const journey = [
    {
      title: "Digital Skills Trainer",
      description:
        "Empowering individuals with the tools and knowledge needed to thrive in a digital-first world.",
    },
    {
      title: "AI & Data Engineering",
      description:
        "Specializing in the architecture and implementation of intelligent data systems and technology solutions.",
    },
    {
      title: "Refugee Tech Advocate",
      description:
        "Championing digital inclusion, technology access, and digital empowerment for marginalized and displaced populations.",
    },
    {
      title: "Data Science Development",
      description:
        "Building impact-driven data science projects that use technology and data to address real-world problems.",
    },
  ];

  return (
    <section
      id='about'
      className='py-24 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto'
    >
      <div className='mb-16 max-w-3xl'>
        <Badge>About Me</Badge>
        <SectionHeading className='mt-4'>
          A journey of purpose and technology.
        </SectionHeading>
        <p className='text-white/60 font-body font-light text-lg mt-6 leading-relaxed'>
          I am a Data Scientist and Cloud Engineer dedicated to transforming
          lives through digital empowerment. My work sits at the intersection of
          advanced analytics, technology, and humanitarian advocacy.
        </p>
        <p className='text-white/60 font-body font-light text-lg mt-4 leading-relaxed'>
          As a Refugee Tech Advocate, I understand the profound impact that
          access to technology and digital skills can have on displaced
          communities. My journey is driven by the belief that data, when used
          ethically and creatively, can be a powerful force for humanity.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {journey.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
            className='liquid-glass rounded-2xl p-10 group hover:bg-white/[0.03] transition-colors border border-white/5'
          >
            <div className='text-white/30 text-xs uppercase tracking-widest mb-6'>{`0${i + 1}`}</div>
            <h4 className='text-xl font-heading text-white mb-3'>
              {step.title}
            </h4>
            <p className='text-white/60 font-body font-light text-sm leading-relaxed'>
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const TerminalSection = () => {
  return (
    <section className='py-24 px-6 md:px-16 lg:px-24 max-w-5xl mx-auto'>
      <div className='mb-12 text-center'>
        <Badge>Try It Out</Badge>
        <SectionHeading className='mt-4'>
          Poke around my terminal.
        </SectionHeading>
        <p className='text-white/60 font-body font-light text-lg mt-6 max-w-2xl mx-auto leading-relaxed'>
          Type <span className='text-white font-medium'>help</span> to see what
          it can do — or try{" "}
          <span className='text-white font-medium'>about</span>,{" "}
          <span className='text-white font-medium'>projects</span>, or{" "}
          <span className='text-white font-medium'>contact</span>.
        </p>
      </div>
      <Terminal />
    </section>
  );
};

const Mission = () => {
  return (
    <section className='relative py-32 px-6 overflow-hidden'>
      <HLSVideo
        src='https://stream.mux.com/NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM.m3u8'
        className='absolute inset-0 w-full h-full object-cover z-0'
        style={{ filter: "saturate(0)" }}
      />

      <div className='absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-black to-transparent z-[1]' />
      <div className='absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-black to-transparent z-[1]' />

      <div className='relative z-10 max-w-4xl mx-auto text-center'>
        <div className='liquid-glass rounded-3xl p-12 md:p-20 backdrop-blur-3xl'>
          <Badge>Mission</Badge>
          <p
            className='font-heading text-2xl md:text-4xl text-white leading-snug mt-4'
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            "I'm building a future where technology meets humanity — where data
            finds purpose, communities find reach, and every digital tool
            becomes a catalyst for change."
          </p>
          <p className='text-white/60 font-body font-light text-base mt-8 leading-relaxed max-w-2xl mx-auto'>
            A journey where data science, cloud engineering, and social impact
            flow together — with less noise, less friction, and more meaning for
            everyone involved.
          </p>
        </div>
      </div>
    </section>
  );
};

const Projects = () => {
  const projects = [
    {
      title: "Motor Vehicle Thefts Analysis",
      category: "New Zealand Crime Data · SQL Database Analysis",
      description:
        "A comprehensive analysis of motor vehicle theft patterns in New Zealand using SQL databases, identifying key trends, recovery rates, and geographic distributions to support law enforcement strategies and public safety initiatives.",
      tech: ["SQL", "Data Analysis", "Public Safety"],
      github:
        "https://github.com/bielng/motor-vehicle-thefts-analysis-in-new-zealand",
    },
    {
      title: "Linear Regression Model Validation",
      category: "Computer Pricing Analysis · Statistical Modeling",
      description:
        "An end-to-end linear regression analysis focused on computer pricing, with comprehensive validation of model assumptions — residual analysis, multicollinearity detection, model evaluation, and optimization.",
      tech: ["Python", "Statistics", "Machine Learning"],
      github: "https://github.com/bielng/model_assumption",
    },
    {
      title: "Maven Music Customer Churn Analysis",
      category: "Music Streaming Platform · Predictive Analytics",
      description:
        "A predictive analysis of customer churn for a music streaming platform, examining user engagement and behavioral patterns, including the relationship between discounts, music preferences, and community engagement.",
      tech: ["Predictive Analytics", "Churn Analysis", "Business Insights"],
      github:
        "https://github.com/bielng/Maven_Music_Customer_Churn_Analysis_Project",
    },
    {
      title: "Movie Ratings Data Cleaning & EDA",
      category: "Entertainment Industry · Data Preprocessing",
      description:
        "A comprehensive data cleaning and exploratory data analysis project on a movie ratings dataset — applying preprocessing techniques, handling missing values, and uncovering patterns in ratings and preferences.",
      tech: ["EDA", "Data Cleaning", "Python"],
      github: "https://github.com/bielng/data_cleaning_and_EDA_prep_project",
    },
    {
      title: "Data Cleaning & Transformation Pipeline",
      category: "End-to-End Data Processing · Workflow Automation",
      description:
        "A complete data processing pipeline demonstrating an end-to-end data preparation workflow — focused on transformation, feature engineering, quality assurance, and preparing datasets for machine learning.",
      tech: ["Automation", "ETL", "Data Engineering"],
      github:
        "https://github.com/bielng/Data-Cleaning-and-Transformation-Project",
    },
  ];

  return (
    <section
      id='projects'
      className='py-24 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto'
    >
      <div className='mb-16'>
        <Badge>Projects</Badge>
        <SectionHeading className='mt-4'>
          Real-world applications and case studies.
        </SectionHeading>
        <p className='text-white/60 font-body font-light text-lg mt-6 max-w-2xl leading-relaxed'>
          Explore my portfolio of data science projects showcasing analytical
          skills, machine learning expertise, and business impact through
          data-driven insights.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {projects.map((project, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            viewport={{ once: true }}
            className='liquid-glass rounded-2xl p-8 md:p-10 flex flex-col justify-between h-full group hover:bg-white/[0.03] transition-colors border border-white/5'
          >
            <div>
              <p className='text-white/40 text-[10px] uppercase tracking-widest mb-3'>
                {project.category}
              </p>
              <h4 className='text-2xl font-heading text-white mb-4'>
                {project.title}
              </h4>
              <p className='text-white/60 font-body font-light text-sm leading-relaxed mb-6'>
                {project.description}
              </p>
              <div className='flex flex-wrap gap-2 mb-8'>
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className='liquid-glass-strong rounded-full px-3 py-1 text-[10px] text-white/70 uppercase tracking-wider'
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <a
              href={project.github}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors group/link'
            >
              <Github className='w-4 h-4' />
              View on GitHub
              <ArrowUpRight className='w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5' />
            </a>
          </motion.div>
        ))}

        {/* Closing CTA card fills the 6th grid slot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 5 * 0.08 }}
          viewport={{ once: true }}
          className='liquid-glass-strong rounded-2xl p-8 md:p-10 flex flex-col items-start justify-center h-full border border-white/10'
        >
          <h4 className='text-2xl font-heading text-white mb-3'>
            Let's collaborate on something meaningful.
          </h4>
          <p className='text-white/60 font-body font-light text-sm leading-relaxed mb-8'>
            Have a project in mind, want to collaborate, or simply want to say
            hi? I'd love to hear from you.
          </p>
          <Button variant='solid' icon={ArrowUpRight} href='#contact'>
            Get in Touch
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

const Contact = () => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormState({ name: "", email: "", message: "" });
    }, 1500);
  };

  return (
    <section
      id='contact'
      className='py-24 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto'
    >
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-16'>
        <div className='space-y-8'>
          <div>
            <Badge>Contact</Badge>
            <SectionHeading className='mt-4'>
              Let's start a conversation.
            </SectionHeading>
            <p className='text-white/60 font-body font-light text-lg mt-6 leading-relaxed'>
              Whether you have a project in mind, want to collaborate, or simply
              want to say hi, I'd love to hear from you. I'm always open to
              discussing new opportunities, meaningful collaborations, and
              impactful ideas.
            </p>
          </div>

          <div className='space-y-6'>
            <div className='flex items-center gap-4 group'>
              <div className='w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center group-hover:scale-110 transition-transform'>
                <Mail className='w-5 h-5 text-white' />
              </div>
              <div>
                <div className='text-white/40 text-[10px] uppercase tracking-widest'>
                  Email Me
                </div>
                <div className='text-white font-body text-sm'>
                  ngunartaban@gmail.com
                </div>
              </div>
            </div>
            <div className='flex items-center gap-4 group'>
              <div className='w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center group-hover:scale-110 transition-transform'>
                <Linkedin className='w-5 h-5 text-white' />
              </div>
              <div>
                <div className='text-white/40 text-[10px] uppercase tracking-widest'>
                  LinkedIn
                </div>
                <a
                  href='https://www.linkedin.com/in/taban-ngunar-x217/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-white font-body text-sm hover:underline'
                >
                  taban-ngunar-x217
                </a>
              </div>
            </div>
            <div className='flex items-center gap-4 group'>
              <div className='w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center group-hover:scale-110 transition-transform'>
                <Github className='w-5 h-5 text-white' />
              </div>
              <div>
                <div className='text-white/40 text-[10px] uppercase tracking-widest'>
                  GitHub
                </div>
                <a
                  href='https://github.com/bielng'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-white font-body text-sm hover:underline'
                >
                  bielng
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className='liquid-glass rounded-3xl p-8 md:p-12 border border-white/5 relative overflow-hidden'>
          <AnimatePresence mode='wait'>
            {!isSubmitted ? (
              <motion.form
                key='form'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className='space-y-6 relative z-10'
              >
                <div className='space-y-2'>
                  <label className='text-[10px] uppercase tracking-widest text-white/40 ml-1'>
                    Full Name
                  </label>
                  <input
                    required
                    type='text'
                    placeholder='Jane Doe'
                    className='w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-white/20 transition-colors'
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-[10px] uppercase tracking-widest text-white/40 ml-1'>
                    Email Address
                  </label>
                  <input
                    required
                    type='email'
                    placeholder='jane@example.com'
                    className='w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-white/20 transition-colors'
                    value={formState.email}
                    onChange={(e) =>
                      setFormState({ ...formState, email: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-[10px] uppercase tracking-widest text-white/40 ml-1'>
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder='Tell me about your project...'
                    className='w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-white/20 transition-colors resize-none'
                    value={formState.message}
                    onChange={(e) =>
                      setFormState({ ...formState, message: e.target.value })
                    }
                  />
                </div>
                <button
                  disabled={isSubmitting}
                  className='w-full liquid-glass-strong rounded-xl py-4 text-white font-body font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50'
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  {!isSubmitting && <Send className='w-4 h-4' />}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key='success'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className='h-full flex flex-col items-center justify-center text-center space-y-4 py-12'
              >
                <div className='w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4'>
                  <Zap className='w-8 h-8 text-emerald-400' />
                </div>
                <h3 className='text-2xl font-heading text-white'>
                  Message Received!
                </h3>
                <p className='text-white/60 font-body font-light text-sm max-w-[240px]'>
                  Thanks for reaching out. I'll get back to you as soon as I
                  can.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className='text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors mt-8'
                >
                  Send another message
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <section className='relative py-32 px-6 overflow-hidden mt-24'>
      <HLSVideo
        src='https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8'
        className='absolute inset-0 w-full h-full object-cover z-0'
      />

      <div className='absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-black to-transparent z-[1]' />
      <div className='absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-black to-transparent z-[1]' />

      <div className='relative z-10 max-w-7xl mx-auto'>
        <footer className='pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6'>
          <div className='flex flex-col items-center md:items-start gap-4'>
            <Logo className='opacity-80 scale-90 origin-left' />
            <p className='text-white/30 text-[10px] uppercase tracking-[0.2em] font-body'>
              © 2026 Taban Ngunar. Data Scientist &amp; Cloud Engineer.
            </p>
          </div>
          <div className='flex items-center gap-8'>
            {["Home", "About", "Projects", "Contact"].map((link) => (
              <a
                key={link}
                href={link === "Home" ? "#" : `#${link.toLowerCase()}`}
                className='text-white/40 hover:text-white text-xs font-body uppercase tracking-widest transition-colors'
              >
                {link}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </section>
  );
};

// --- Main App ---

export default function App() {
  return (
    <div className='bg-black min-h-screen w-full selection:bg-white selection:text-black'>
      <Navbar />
      <main>
        <Hero />
        <ArtSection />
        <DataHasChanged />
        <CapabilitiesChess />
        <Expertise />
        <About />
        <TerminalSection />
        <Mission />
        <Projects />
        <Contact />
        <Footer />
      </main>
    </div>
  );
}
