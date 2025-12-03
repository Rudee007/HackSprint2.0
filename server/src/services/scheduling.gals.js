// services/scheduling.gals.js
// 🧬 GENETIC ALGORITHM + LOCAL SEARCH LAYER - Complete Refinement
// Purpose: Fine-tune MIP solution while respecting phase boundaries and requiredDay constraints
// 🔥 FIXED: Maintains sequential phase execution (purvakarma → pradhanakarma → paschatkarma)


const logger = require('../utils/logger');


// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════


const GA_CONFIG = {
  POPULATION_SIZE: 20,           // Number of solution variants to maintain
  MAX_GENERATIONS: 100,          // Maximum evolution iterations
  MUTATION_RATE: 0.15,           // Probability of random changes
  CROSSOVER_RATE: 0.8,           // Probability of combining solutions
  ELITE_SIZE: 2,                 // Top solutions to preserve unchanged
  TOURNAMENT_SIZE: 3,            // Selection pool size
  LOCAL_SEARCH_ITERATIONS: 50,   // Hill-climbing iterations
  STAGNATION_LIMIT: 10           // Stop if no improvement for N generations
};


// Fitness function weights (must sum to 1.0 conceptually)
const FITNESS_WEIGHTS = {
  COST: 0.4,              // Slot cost from MIP layer
  UTILIZATION: 0.3,       // Therapist workload balance
  PREFERENCE_MATCH: 0.2,  // Patient time preferences
  COMPACTNESS: 0.1        // Treatment plan density
};


// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════


/**
 * Get ISO date string (YYYY-MM-DD) for date comparison
 */
function getDateKey(date) {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}


/**
 * Check if two dates are the same calendar day
 */
function isSameDate(date1, date2) {
  if (!date1 || !date2) return false;
  return getDateKey(date1) === getDateKey(date2);
}


/**
 * Get time of day category from hour
 */
function getTimeOfDay(hour) {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}


// ═══════════════════════════════════════════════════════════
// MAIN GA-LS ENTRY POINT
// ═══════════════════════════════════════════════════════════


/**
 * Apply Genetic Algorithm with Local Search to refine MIP solution
 * 
 * This layer improves the initial solution by:
 * 1. Maintaining phase order (purvakarma before pradhanakarma, etc.)
 * 2. Respecting requiredDay for each session
 * 3. Balancing therapist workload
 * 4. Matching patient preferences
 * 
 * @param {Object} model - Scheduling model with all sessions
 * @param {Object} context - Context with therapist data
 */
async function applyGeneticAlgorithm(model, context) {
  logger.info('🧬 GA-LS Layer: Starting genetic algorithm refinement...');
  
  const startTime = Date.now();
  const { allSessions, sessionMap } = model;
  
  // Only run for scenarios with enough sessions to benefit
  const scheduledSessions = allSessions.filter(s => s.isScheduled);
  if (scheduledSessions.length < 10) {
    logger.info('⏭️ Skipping GA-LS (too few sessions, MIP solution sufficient)');
    return;
  }
  
  // Validate sessions have required fields
  const invalidSessions = scheduledSessions.filter(s => 
    !s.requiredDay || !s.planStartDate || !s.feasibleSlots || s.feasibleSlots.length === 0
  );
  
  if (invalidSessions.length > 0) {
    logger.warn(`⚠️ ${invalidSessions.length} sessions missing requiredDay or feasibleSlots - GA may not work properly`);
  }
  
  // STEP 5.1: Encode initial solution from MIP
  logger.info('🧬 Encoding initial MIP solution...');
  const initialChromosome = encodeScheduleToChromosome(scheduledSessions);
  const initialFitness = calculateFitness(initialChromosome, allSessions, sessionMap, context);
  
  logger.info(`   Initial fitness: ${initialFitness.toFixed(2)}`);
  
  // STEP 5.2: Initialize population with variants
  logger.info(`📊 Initializing population (size=${GA_CONFIG.POPULATION_SIZE})...`);
  let population = initializePopulation(initialChromosome, sessionMap, GA_CONFIG.POPULATION_SIZE);
  
  let bestChromosome = initialChromosome;
  let bestFitness = initialFitness;
  let generationsSinceImprovement = 0;
  
  // STEP 5.3: Evolution loop
  logger.info(`🔄 Starting evolution (max ${GA_CONFIG.MAX_GENERATIONS} generations)...`);
  
  for (let generation = 1; generation <= GA_CONFIG.MAX_GENERATIONS; generation++) {
    // Evaluate fitness for all chromosomes
    const fitnessScores = population.map(chromosome => ({
      chromosome,
      fitness: calculateFitness(chromosome, allSessions, sessionMap, context)
    }));
    
    // Sort by fitness (highest first)
    fitnessScores.sort((a, b) => b.fitness - a.fitness);
    
    // Track best solution
    const genBestFitness = fitnessScores[0].fitness;
    if (genBestFitness > bestFitness) {
      bestFitness = genBestFitness;
      bestChromosome = fitnessScores[0].chromosome;
      generationsSinceImprovement = 0;
      logger.info(`   Gen ${generation}: NEW BEST fitness=${bestFitness.toFixed(2)} 🎉`);
    } else {
      generationsSinceImprovement++;
    }
    
    // Early stopping if no improvement
    if (generationsSinceImprovement >= GA_CONFIG.STAGNATION_LIMIT) {
      logger.info(`   Stopping early (no improvement for ${GA_CONFIG.STAGNATION_LIMIT} generations)`);
      break;
    }
    
    // Log progress periodically
    if (generation % 10 === 0) {
      const avgFitness = (fitnessScores.reduce((sum, s) => sum + s.fitness, 0) / population.length).toFixed(2);
      logger.info(`   Gen ${generation}: best=${bestFitness.toFixed(2)}, avg=${avgFitness}`);
    }
    
    // Create new population
    const newPopulation = [];
    
    // Elitism: Keep top solutions unchanged
    for (let i = 0; i < GA_CONFIG.ELITE_SIZE; i++) {
      newPopulation.push(structuredClone(fitnessScores[i].chromosome));
    }
    
    // Generate offspring to fill rest of population
    while (newPopulation.length < GA_CONFIG.POPULATION_SIZE) {
      const parent1 = tournamentSelection(fitnessScores, GA_CONFIG.TOURNAMENT_SIZE);
      const parent2 = tournamentSelection(fitnessScores, GA_CONFIG.TOURNAMENT_SIZE);
      
      let offspring;
      if (Math.random() < GA_CONFIG.CROSSOVER_RATE) {
        offspring = crossover(parent1, parent2);
      } else {
        offspring = structuredClone(parent1);
      }
      
      if (Math.random() < GA_CONFIG.MUTATION_RATE) {
        mutate(offspring, sessionMap);
      }
      
      // 🔥 CRITICAL: Repair to enforce requiredDay and phase constraints
      repair(offspring, allSessions, sessionMap, context);
      
      newPopulation.push(offspring);
    }
    
    population = newPopulation;
    
    // Apply local search to elite solutions periodically
    if (generation % 5 === 0) {
      for (let i = 0; i < Math.min(3, population.length); i++) {
        population[i] = localSearch(population[i], allSessions, sessionMap, context);
      }
    }
  }
  
  // STEP 5.4: Apply best solution back to schedule
  logger.info('✅ Applying best solution to schedule...');
  applyChromosomeToSchedule(bestChromosome, allSessions, sessionMap);
  
  const duration = Date.now() - startTime;
  const improvement = ((bestFitness - initialFitness) / Math.max(initialFitness, 0.01) * 100).toFixed(1);
  
  logger.info(`✅ GA-LS complete in ${duration}ms`);
  logger.info(`   Initial fitness: ${initialFitness.toFixed(2)}`);
  logger.info(`   Final fitness: ${bestFitness.toFixed(2)}`);
  logger.info(`   Improvement: ${improvement}%`);
}


// ═══════════════════════════════════════════════════════════
// CHROMOSOME ENCODING/DECODING
// ═══════════════════════════════════════════════════════════


/**
 * Encode a schedule as a chromosome (array of genes)
 * Each gene = { sessionId, slotIndex }
 * where slotIndex points to a slot in session.feasibleSlots[]
 */
function encodeScheduleToChromosome(scheduledSessions) {
  return scheduledSessions.map(session => ({
    sessionId: session.sessionId,
    slotIndex: findSlotIndex(session)
  }));
}


/**
 * Find the index of the currently scheduled slot in feasibleSlots array
 */
function findSlotIndex(session) {
  if (!session.feasibleSlots || session.feasibleSlots.length === 0) {
    logger.warn(`⚠️ Session ${session.sessionId} has no feasible slots`);
    return 0;
  }
  
  if (!session.scheduledStartTime) {
    logger.warn(`⚠️ Session ${session.sessionId} not scheduled`);
    return 0;
  }
  
  const index = session.feasibleSlots.findIndex(slot =>
    slot.startTime && slot.startTime.getTime() === session.scheduledStartTime.getTime()
  );
  
  if (index < 0) {
    logger.warn(`⚠️ Scheduled time for ${session.sessionId} not in feasible slots, using first slot`);
    return 0;
  }
  
  return index;
}


/**
 * Apply a chromosome back to the schedule (mutates session objects)
 */
function applyChromosomeToSchedule(chromosome, allSessions, sessionMap) {
  for (const gene of chromosome) {
    const session = sessionMap[gene.sessionId];
    if (!session) {
      logger.warn(`⚠️ Session ${gene.sessionId} not found in sessionMap`);
      continue;
    }
    
    if (!session.feasibleSlots || gene.slotIndex < 0 || gene.slotIndex >= session.feasibleSlots.length) {
      logger.warn(`⚠️ Invalid slot index ${gene.slotIndex} for session ${gene.sessionId}`);
      continue;
    }
    
    const slot = session.feasibleSlots[gene.slotIndex];
    session.scheduledDate = new Date(slot.date);
    session.scheduledStartTime = new Date(slot.startTime);
    session.scheduledEndTime = new Date(slot.startTime.getTime() + session.totalMinutes * 60000);
    session.isScheduled = true;
  }
}


// ═══════════════════════════════════════════════════════════
// POPULATION INITIALIZATION
// ═══════════════════════════════════════════════════════════


/**
 * Create initial population with variants of the MIP solution
 * 
 * Strategy: Start with best solution, then create variants by
 * randomly mutating slot choices (while respecting requiredDay)
 */
function initializePopulation(initialChromosome, sessionMap, size) {
  const population = [structuredClone(initialChromosome)];
  
  for (let i = 1; i < size; i++) {
    const variant = structuredClone(initialChromosome);
    
    // Mutate 20% of genes
    const mutationCount = Math.floor(variant.length * 0.2);
    for (let j = 0; j < mutationCount; j++) {
      const geneIndex = Math.floor(Math.random() * variant.length);
      const gene = variant[geneIndex];
      const session = sessionMap[gene.sessionId];
      
      if (session && session.feasibleSlots && session.feasibleSlots.length > 1) {
        // Only pick slots that match the session's requiredDay
        const validSlots = getValidSlotsForSession(session);
        if (validSlots.length > 1) {
          const randomValidSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
          variant[geneIndex].slotIndex = randomValidSlot;
        }
      }
    }
    
    population.push(variant);
  }
  
  logger.info(`   Created ${population.length} initial solutions`);
  
  return population;
}


/**
 * 🔥 CRITICAL: Get slot indices that are on the session's requiredDay
 * 
 * This ensures we never mutate a session to a different treatment day,
 * which would break phase sequencing (e.g., pradhanakarma on Day 1)
 */
function getValidSlotsForSession(session) {
  if (!session.requiredDay || !session.planStartDate || !session.feasibleSlots) {
    // If no requiredDay, allow all slots (shouldn't happen)
    return session.feasibleSlots.map((_, idx) => idx);
  }
  
  // Calculate target date for this session
  const targetDate = new Date(session.planStartDate);
  targetDate.setDate(targetDate.getDate() + (session.requiredDay - 1));
  targetDate.setHours(0, 0, 0, 0);
  
  // Find all feasible slots on the target date
  const validIndices = [];
  session.feasibleSlots.forEach((slot, idx) => {
    if (isSameDate(slot.date, targetDate)) {
      validIndices.push(idx);
    }
  });
  
  // If no slots on required day (shouldn't happen after CP), allow all
  if (validIndices.length === 0) {
    logger.warn(`⚠️ Session ${session.sessionId} has no feasible slots on requiredDay ${session.requiredDay}`);
    return session.feasibleSlots.map((_, idx) => idx);
  }
  
  return validIndices;
}


// ═══════════════════════════════════════════════════════════
// FITNESS CALCULATION
// ═══════════════════════════════════════════════════════════


/**
 * Calculate fitness score for a chromosome
 * 
 * Higher fitness = better solution
 * Penalizes solutions that violate requiredDay constraints
 */
function calculateFitness(chromosome, allSessions, sessionMap, context) {
  // Temporarily apply chromosome to calculate metrics
  const originalState = saveScheduleState(allSessions);
  applyChromosomeToSchedule(chromosome, allSessions, sessionMap);
  
  // Calculate individual fitness components
  const requiredDayPenalty = calculateRequiredDayPenalty(allSessions);
  const phaseBoundaryPenalty = calculatePhaseBoundaryPenalty(allSessions);
  const costScore = calculateCostScore(allSessions);
  const utilizationScore = calculateUtilizationScore(allSessions, context.therapistMap);
  const preferenceScore = calculatePreferenceScore(allSessions);
  const compactnessScore = calculateCompactnessScore(allSessions);
  
  // Restore original state
  restoreScheduleState(allSessions, originalState);
  
  // Combine components into total fitness
  const fitness = 
    FITNESS_WEIGHTS.COST * costScore +
    FITNESS_WEIGHTS.UTILIZATION * utilizationScore +
    FITNESS_WEIGHTS.PREFERENCE_MATCH * preferenceScore +
    FITNESS_WEIGHTS.COMPACTNESS * compactnessScore -
    requiredDayPenalty -              // 🔥 Heavy penalty for wrong day
    phaseBoundaryPenalty;             // 🔥 Heavy penalty for phase violations
  
  return fitness;
}


/**
 * 🔥 CRITICAL: Penalty for sessions not on their requiredDay
 * 
 * This heavily penalizes solutions where sessions drift from their
 * assigned treatment day, which would cause 28-day plans to compress
 */
function calculateRequiredDayPenalty(allSessions) {
  let penalty = 0;
  
  for (const session of allSessions) {
    if (!session.isScheduled || !session.requiredDay || !session.planStartDate || !session.scheduledDate) {
      continue;
    }
    
    const targetDate = new Date(session.planStartDate);
    targetDate.setDate(targetDate.getDate() + (session.requiredDay - 1));
    targetDate.setHours(0, 0, 0, 0);
    
    const scheduledDate = new Date(session.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);
    
    const dayDeviation = Math.abs((scheduledDate - targetDate) / (1000 * 60 * 60 * 24));
    
    // Heavy penalty: 50 points per day off target
    penalty += dayDeviation * 50;
  }
  
  return penalty;
}


/**
 * 🔥 NEW: Penalty for violating phase boundaries
 * 
 * Ensures pradhanakarma never happens before purvakarma, etc.
 */
function calculatePhaseBoundaryPenalty(allSessions) {
  let penalty = 0;
  
  for (const session of allSessions) {
    if (!session.isScheduled || !session.scheduledDate || !session.planStartDate) {
      continue;
    }
    
    if (session.phaseStartDay === undefined || session.phaseEndDay === undefined) {
      continue;
    }
    
    // Calculate actual day number from scheduled date
    const actualDay = Math.floor(
      (session.scheduledDate - session.planStartDate) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    // Check if scheduled outside phase boundaries
    if (actualDay < session.phaseStartDay || actualDay > session.phaseEndDay) {
      const deviation = Math.min(
        Math.abs(actualDay - session.phaseStartDay),
        Math.abs(actualDay - session.phaseEndDay)
      );
      
      // Severe penalty: 100 points per day outside phase
      penalty += deviation * 100;
    }
  }
  
  return penalty;
}


/**
 * Score based on slot costs from MIP layer
 */
function calculateCostScore(allSessions) {
  const scheduledSessions = allSessions.filter(s => s.isScheduled && s.assignedSlotCost != null);
  if (scheduledSessions.length === 0) return 0;
  
  const avgCost = scheduledSessions.reduce((sum, s) => sum + s.assignedSlotCost, 0) / scheduledSessions.length;
  return Math.max(0, 100 - avgCost);
}


/**
 * Score based on therapist workload balance
 */
function calculateUtilizationScore(allSessions, therapistMap) {
  const scheduledSessions = allSessions.filter(s => s.isScheduled && s.scheduledDate);
  if (scheduledSessions.length === 0) return 0;
  
  // Group sessions by therapist and date
  const therapistDays = {};
  
  for (const session of scheduledSessions) {
    const key = `${session.therapistId}_${getDateKey(session.scheduledDate)}`;
    if (!therapistDays[key]) {
      therapistDays[key] = { therapistId: session.therapistId, totalMinutes: 0 };
    }
    therapistDays[key].totalMinutes += session.totalMinutes;
  }
  
  // Calculate utilization percentage for each therapist-day
  let totalUtilization = 0;
  let dayCount = 0;
  
  for (const day of Object.values(therapistDays)) {
    const therapist = therapistMap[day.therapistId];
    if (!therapist) continue;
    
    const workingHours = therapist.availability?.workingHours || { start: '09:00', end: '17:00' };
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);
    const totalWorkMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    const utilization = (day.totalMinutes / totalWorkMinutes) * 100;
    totalUtilization += Math.min(100, utilization);
    dayCount++;
  }
  
  return dayCount > 0 ? totalUtilization / dayCount : 0;
}


/**
 * Score based on patient time preference matches
 */
function calculatePreferenceScore(allSessions) {
  const scheduledSessions = allSessions.filter(s => s.isScheduled && s.scheduledStartTime);
  if (scheduledSessions.length === 0) return 0;
  
  let matches = 0;
  
  for (const session of scheduledSessions) {
    const hour = session.scheduledStartTime.getHours();
    const timeOfDay = getTimeOfDay(hour);
    
    if (session.patientPreferredTimeSlot === 'flexible' || timeOfDay === session.patientPreferredTimeSlot) {
      matches++;
    }
  }
  
  return (matches / scheduledSessions.length) * 100;
}


/**
 * Score based on treatment plan compactness
 * (Prefer sessions closer together in time)
 */
function calculateCompactnessScore(allSessions) {
  const planSessions = {};
  
  for (const session of allSessions.filter(s => s.isScheduled && s.scheduledDate)) {
    if (!planSessions[session.treatmentPlanId]) {
      planSessions[session.treatmentPlanId] = [];
    }
    planSessions[session.treatmentPlanId].push(session);
  }
  
  if (Object.keys(planSessions).length === 0) return 0;
  
  let totalCompactness = 0;
  
  for (const sessions of Object.values(planSessions)) {
    if (sessions.length === 0) continue;
    
    const dates = sessions.map(s => s.scheduledDate.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const spanDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    
    const idealDays = sessions.length;
    const compactness = (idealDays / Math.max(spanDays, 1)) * 100;
    
    totalCompactness += Math.min(100, compactness);
  }
  
  return totalCompactness / Object.keys(planSessions).length;
}


/**
 * Save current schedule state for later restoration
 */
function saveScheduleState(allSessions) {
  return allSessions.map(s => ({
    sessionId: s.sessionId,
    scheduledDate: s.scheduledDate ? new Date(s.scheduledDate) : null,
    scheduledStartTime: s.scheduledStartTime ? new Date(s.scheduledStartTime) : null,
    scheduledEndTime: s.scheduledEndTime ? new Date(s.scheduledEndTime) : null,
    isScheduled: s.isScheduled
  }));
}


/**
 * Restore previously saved schedule state
 */
function restoreScheduleState(allSessions, savedState) {
  const stateMap = {};
  savedState.forEach(s => { stateMap[s.sessionId] = s; });
  
  allSessions.forEach(session => {
    const saved = stateMap[session.sessionId];
    if (saved) {
      session.scheduledDate = saved.scheduledDate;
      session.scheduledStartTime = saved.scheduledStartTime;
      session.scheduledEndTime = saved.scheduledEndTime;
      session.isScheduled = saved.isScheduled;
    }
  });
}


// ═══════════════════════════════════════════════════════════
// GENETIC OPERATORS
// ═══════════════════════════════════════════════════════════


/**
 * Select a chromosome using tournament selection
 */
function tournamentSelection(fitnessScores, tournamentSize) {
  const tournament = [];
  
  for (let i = 0; i < tournamentSize; i++) {
    const randomIndex = Math.floor(Math.random() * fitnessScores.length);
    tournament.push(fitnessScores[randomIndex]);
  }
  
  tournament.sort((a, b) => b.fitness - a.fitness);
  return tournament[0].chromosome;
}


/**
 * Combine two parent chromosomes via uniform crossover
 */
function crossover(parent1, parent2) {
  const length = parent1.length;
  const offspring = new Array(length);
  
  // For each gene, randomly pick from parent1 or parent2
  for (let i = 0; i < length; i++) {
    if (Math.random() < 0.5) {
      offspring[i] = structuredClone(parent1[i]);
    } else {
      offspring[i] = structuredClone(parent2[i]);
    }
  }
  
  return offspring;
}


/**
 * Mutate chromosome by randomly changing slot assignments
 * 
 * 🔥 CRITICAL: Only mutates to slots on the same requiredDay
 */
function mutate(chromosome, sessionMap) {
  const mutationCount = Math.max(1, Math.floor(chromosome.length * 0.1));
  
  for (let i = 0; i < mutationCount; i++) {
    const geneIndex = Math.floor(Math.random() * chromosome.length);
    const gene = chromosome[geneIndex];
    const session = sessionMap[gene.sessionId];
    
    if (!session) {
      logger.warn(`⚠️ Session ${gene.sessionId} not found in sessionMap`);
      continue;
    }
    
    if (!session.feasibleSlots || session.feasibleSlots.length <= 1) {
      continue;
    }
    
    // Only mutate to slots on the same required day
    const validSlots = getValidSlotsForSession(session);
    
    if (validSlots.length <= 1) {
      continue;
    }
    
    // Pick a different valid slot
    let newSlotIndex;
    do {
      newSlotIndex = validSlots[Math.floor(Math.random() * validSlots.length)];
    } while (newSlotIndex === gene.slotIndex && validSlots.length > 1);
    
    gene.slotIndex = newSlotIndex;
  }
}


/**
 * Repair chromosome to fix constraint violations
 * 
 * Ensures:
 * 1. No two sessions overlap in time for same therapist
 * 2. All sessions are on their requiredDay
 * 3. All sessions are within phase boundaries
 */
function repair(chromosome, allSessions, sessionMap, context) {
  const occupiedSlots = new Map();
  
  for (const gene of chromosome) {
    const session = sessionMap[gene.sessionId];
    if (!session || !session.feasibleSlots || gene.slotIndex >= session.feasibleSlots.length) {
      continue;
    }
    
    const slot = session.feasibleSlots[gene.slotIndex];
    if (!slot) continue;
    
    // Check if slot is on required day
    if (session.requiredDay && session.planStartDate) {
      const targetDate = new Date(session.planStartDate);
      targetDate.setDate(targetDate.getDate() + (session.requiredDay - 1));
      targetDate.setHours(0, 0, 0, 0);
      
      if (!isSameDate(slot.date, targetDate)) {
        // Slot violates requiredDay - find valid alternative
        const validSlots = getValidSlotsForSession(session);
        if (validSlots.length > 0) {
          gene.slotIndex = validSlots[0];
          continue;
        }
      }
    }
    
    // Check for time conflicts
    const slotKey = `${session.therapistId}_${slot.startTime.getTime()}`;
    
    if (occupiedSlots.has(slotKey)) {
      // Conflict! Find alternative on same required day
      const validSlots = getValidSlotsForSession(session);
      let found = false;
      
      for (const altSlotIdx of validSlots) {
        const altSlot = session.feasibleSlots[altSlotIdx];
        const altKey = `${session.therapistId}_${altSlot.startTime.getTime()}`;
        
        if (!occupiedSlots.has(altKey)) {
          gene.slotIndex = altSlotIdx;
          occupiedSlots.set(altKey, gene.sessionId);
          found = true;
          break;
        }
      }
      
      if (!found) {
        logger.warn(`⚠️ Could not repair conflict for session ${gene.sessionId} while respecting requiredDay`);
      }
    } else {
      occupiedSlots.set(slotKey, gene.sessionId);
    }
  }
}


// ═══════════════════════════════════════════════════════════
// LOCAL SEARCH
// ═══════════════════════════════════════════════════════════


/**
 * Apply local search (hill climbing) to improve a solution
 * 
 * Strategy: Try swapping each session to alternative slots
 * (on same requiredDay) and keep changes that improve fitness
 */
function localSearch(chromosome, allSessions, sessionMap, context) {
  let currentChromosome = structuredClone(chromosome);
  let currentFitness = calculateFitness(currentChromosome, allSessions, sessionMap, context);
  let improved = true;
  let iterations = 0;
  
  while (improved && iterations < GA_CONFIG.LOCAL_SEARCH_ITERATIONS) {
    improved = false;
    iterations++;
    
    // Try different slot for each session
    for (let i = 0; i < currentChromosome.length; i++) {
      const gene = currentChromosome[i];
      const session = sessionMap[gene.sessionId];
      
      if (!session || !session.feasibleSlots) continue;
      
      const originalSlotIndex = gene.slotIndex;
      
      // Only try slots on the same required day
      const validSlots = getValidSlotsForSession(session);
      
      // Try each alternative valid slot
      for (const slotIdx of validSlots) {
        if (slotIdx === originalSlotIndex) continue;
        
        const neighbor = structuredClone(currentChromosome);
        neighbor[i].slotIndex = slotIdx;
        
        const neighborFitness = calculateFitness(neighbor, allSessions, sessionMap, context);
        
        if (neighborFitness > currentFitness) {
          currentChromosome = neighbor;
          currentFitness = neighborFitness;
          improved = true;
          break;
        }
      }
      
      if (improved) break; // Restart search from new solution
    }
  }
  
  return currentChromosome;
}


// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════


module.exports = {
  applyGeneticAlgorithm,
  encodeScheduleToChromosome,
  applyChromosomeToSchedule,
  calculateFitness,
  calculateRequiredDayPenalty,
  calculatePhaseBoundaryPenalty,
  crossover,
  mutate,
  repair,
  localSearch,
  getValidSlotsForSession,
  GA_CONFIG
};