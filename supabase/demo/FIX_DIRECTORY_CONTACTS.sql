-- ============================================================================
-- FIX_DIRECTORY_CONTACTS.sql
-- Populates directory_contacts table from Sunbelt_Directory_Combined.csv
--
-- Run this in Supabase SQL Editor after COMPREHENSIVE_DEMO_DATA.sql
-- ============================================================================

-- Clear existing directory contacts
TRUNCATE TABLE directory_contacts CASCADE;

-- ============================================================================
-- INSERT ALL DIRECTORY CONTACTS
-- Organized by Factory/Location
-- ============================================================================

-- ============================================================================
-- SNB (Corporate - Sunbelt)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  -- Executive
  ('Ron', 'Procunier', 'Ron Procunier', NULL, 'Chief Executive Officer (CEO)', '6024476460', NULL, NULL, 'SNB', 'EXECUTIVE', true),
  ('Bob', 'Lahmann', 'Bob Lahmann', 'bob.lahmann@sunbeltmodular.com', 'Chief Financial Officer (CFO)', NULL, '4103007926', NULL, 'SNB', 'EXECUTIVE', true),
  ('Gary', 'Davenport', 'Gary Davenport', 'gary.davenport@sunbeltmodular.com', 'Chief Revenue Officer (CRO)', NULL, '7046193665', NULL, 'SNB', 'EXECUTIVE', true),

  -- Finance/Accounting
  ('Mitch', 'Marois', 'Mitch Marois', 'mitch.marois@sunbeltmodular.com', 'Director of FP&A', '6024476460', '6025793316', '138', 'SNB', 'ACCOUNTING', true),
  ('Irina', 'Lee', 'Irina Lee', 'irina.lee@sunbeltmodular.com', 'FP&A Analyst', NULL, '6236937203', NULL, 'SNB', 'ACCOUNTING', true),
  ('Dawn', 'Polk', 'Dawn Polk', 'dawn.polk@sunbeltmodular.com', 'Cost Acct Manager - East', NULL, '9123812106', NULL, 'SNB', 'ACCOUNTING', true),
  ('Wendy', 'Li', 'Wendy Li', 'wendy.li@sunbeltmodular.com', 'Corporate Controller', '6024476460', '6029108008', '303', 'SNB', 'ACCOUNTING', true),
  ('Demi', 'Nguyen', 'Demi Nguyen', 'demi.nguyen@sunbeltmodular.com', 'Senior GL Analyst', '6024476460', '6027170801', '302', 'SNB', 'ACCOUNTING', true),
  ('Aina', 'Padasdao', 'Aina Padasdao', 'aina.padasdao@sunbeltmodular.com', 'Staff Accountant', '6024476460', NULL, '301', 'SNB', 'ACCOUNTING', true),

  -- HR
  ('Ibet', 'Murillo', 'Ibet Murillo', 'ibet.murillo@sunbeltmodular.com', 'Vice President of HR & Integration', '6024476460', '6024668456', '112', 'SNB', 'HR', true),
  ('Argelia', 'Gonzalez', 'Argelia Gonzalez', 'argelia.gonzalez@sunbeltmodular.com', 'Benefits/Payroll Supervisor', '6024476460', '6025411021', '124', 'SNB', 'HR', true),
  ('Kaitlyn', 'Pogue', 'Kaitlyn Pogue', 'kaitlyn.pogue@sunbeltmodular.com', 'HR Compliance Specialist', '2087817012', '2088694297', NULL, 'SNB', 'HR', true),

  -- Marketing
  ('Toni', 'Jacoby', 'Toni Jacoby', 'toni.jacoby@sunbeltmodular.com', 'Director of Marketing', NULL, '6027689265', NULL, 'SNB', 'MARKETING', true),
  ('Ashley', 'Camp', 'Ashley Camp', 'ashley.camp@sunbeltmodular.com', 'Marketing Coordinator & Event Planner', '3527282930', '9289209171', '336', 'SNB', 'MARKETING', true),

  -- Business Development
  ('Frank', 'Monahan', 'Frank Monahan', 'frank.monahan@sunbeltmodular.com', 'Vice President of Business Development', NULL, '6027934869', NULL, 'SNB', 'SALES', true),
  ('Andreas', 'Klinckwort', 'Andreas Klinckwort', 'aklinckwort@britcousa.com', 'Sales Manager - Energy', '2547416701', '2813846072', NULL, 'SNB', 'SALES', true),
  ('Thomas', 'Cassity', 'Thomas Cassity', 'tom.cassity@sunbeltmodular.com', 'Business Development - Healthcare', '3527282930', '3526263313', '321', 'SNB', 'SALES', true),
  ('Desiree', 'Galan', 'Desiree Galan', 'desiree.galan@sunbeltmodular.com', 'Business Development', '6024476460', '6023975465', '102', 'SNB', 'SALES', true),
  ('Edwin', 'Villegas', 'Edwin Villegas', 'edwin.villegas@sunbeltmodular.com', 'Designer', '3527282930', NULL, NULL, 'SNB', 'DRAFTING', true),

  -- Sales - Central
  ('Brent', 'Morgan', 'Brent Morgan', 'bmorgan@britcousa.com', 'Vice President of Sales (Central)', '2547416701', '2543138306', NULL, 'SNB', 'SALES', true),
  ('Jason', 'King', 'Jason King', 'jason.king@sunbeltmodular.com', 'Sales Manager - Major Projects (Central)', '6024476460', '6027815134', '122', 'SNB', 'SALES', true),

  -- Sales - East
  ('Casey', 'Tanner', 'Casey Tanner', 'casey.tanner@sunbeltmodular.com', 'Vice President of Sales (East)', NULL, '9123812757', NULL, 'SNB', 'SALES', true),
  ('Barbara', 'Hicks', 'Barbara Hicks', 'barbara.hicks@sunbeltmodular.com', 'Sales Manager - Major Projects (East)', NULL, '2298158960', NULL, 'SNB', 'SALES', true),
  ('Roger', 'Suggs', 'Roger Suggs', 'roger.suggs@sunbeltmodular.com', 'Sales & Estimating', NULL, '7066816819', NULL, 'SNB', 'SALES', true),
  ('Johnny', 'Haskins', 'Johnny Haskins', 'johnny.haskins@sunbeltmodular.com', 'Sales & Estimating', NULL, '9123935804', NULL, 'SNB', 'SALES', true),

  -- Sales - West
  ('Jay', 'Vanvlerah', 'Jay Vanvlerah', 'jay.vanvlerah@sunbeltmodular.com', 'Vice President of Sales (West)', NULL, '2142074044', NULL, 'SNB', 'SALES', true),
  ('Casey', 'Knipp', 'Casey Knipp', 'casey.knipp@sunbeltmodular.com', 'Sales Manager - Major Projects (West)', '6024476460', '6027815208', '106', 'SNB', 'SALES', true),
  ('George', 'Avila', 'George Avila', 'george.avila@sunbeltmodular.com', 'Sales Estimator - Major Projects (West)', NULL, '4806178727', NULL, 'SNB', 'SALES', true),
  ('Leah', 'Curtis', 'Leah Curtis', 'leah.curtis@sunbeltmodular.com', 'Sales & Estimating', '6024476460', '6027816563', '117', 'SNB', 'SALES', true),
  ('Michael', 'Schmid', 'Michael Schmid', 'michael.schmid@sunbeltmodular.com', 'Sales & Estimating', NULL, '7207665759', NULL, 'SNB', 'SALES', true),
  ('Nydia', 'Mora', 'Nydia Mora', 'nydia.mora@phoenixmodular.com', 'Sales & Estimating', '6024476460', NULL, '141', 'SNB', 'SALES', true),

  -- Operations
  ('Jay', 'Daniels', 'Jay Daniels', 'jay.daniels@sunbeltmodular.com', 'Vice President of Operations', '6024476460', '6023274768', '129', 'SNB', 'OPERATIONS', true),
  ('Kim', 'Souvannarath', 'Kim Souvannarath', 'kim.souvannarath@sunbeltmodular.com', 'Estimating & Inventory Systems Manager', '6024476460', '6232610129', '304', 'SNB', 'OPERATIONS', true),
  ('Monica', 'Mora', 'Monica Mora', 'monica.mora@sunbeltmodular.com', 'Purchasing Assistant', '6024476460', NULL, '134', 'SNB', 'PURCHASING', true),
  ('David', 'Mejia', 'David Mejia', 'david.mejia@sunbeltmodular.com', 'Vice President of Estimating & Inventory Systems', '6024476460', '6023274770', '104', 'SNB', 'OPERATIONS', true),

  -- IT
  ('David', 'Sousa', 'David Sousa', 'david.sousa@sunbeltmodular.com', 'IT Manager - West', '6024476460', '6024781531', '139', 'SNB', 'IT', true),
  ('Roy', 'Ray', 'Roy Ray', 'ron.ray@sunbeltmodular.com', 'IT Manager - East', NULL, NULL, NULL, 'SNB', 'IT', true),
  ('Joy', 'Thomas', 'Joy Thomas', 'joy.thomas@sunbeltmodular.com', 'Lead Programmer', NULL, '4806888899', NULL, 'SNB', 'IT', true),
  ('Aaron', 'Olheiser', 'Aaron Olheiser', 'aaron.olheiser@sunbeltmodular.com', 'Network Administrator', NULL, '4805996918', NULL, 'SNB', 'IT', true),
  ('Mark', 'Mirgon', 'Mark Mirgon', 'mark.mirgon@sunbeltmodular.com', 'System Administrator', '6024476460', NULL, '305', 'SNB', 'IT', true),

  -- Purchasing
  ('Frank', 'Delucia', 'Frank Delucia', 'frank.delucia@sunbeltmodular.com', 'Director of Purchasing', '6024476460', '6025824368', '103', 'SNB', 'PURCHASING', true),
  ('Crystal', 'Diaz', 'Crystal Diaz', 'crystal.diaz@sunbeltmodular.com', 'Commodity Specialist', '6024476460', '6234322447', '111', 'SNB', 'PURCHASING', true),
  ('Ryan', 'Mercado', 'Ryan Mercado', 'ryan.mercado@sunbeltmodular.com', 'Purchasing Assistant', '6024476460', NULL, '108', 'SNB', 'PURCHASING', true),

  -- Manufacturing
  ('Devin', 'Duvak', 'Devin Duvak', 'devin.duvak@sunbeltmodular.com', 'Vice President of Manufacturing', '8174471213', '8175593737', '5801', 'SNB', 'PRODUCTION', true),
  ('Joe', 'Hall', 'Joe Hall', 'joe.hall@sunbeltmodular.com', 'Director of Manufacturing (East)', '2299375401', '2299384640', NULL, 'SNB', 'PRODUCTION', true),

  -- Project Managers (Corporate PM Team)
  ('Candace', 'Juhnke', 'Candy Juhnke', 'candy.juhnke@sunbeltmodular.com', 'Project Manager', NULL, '6028037224', NULL, 'SNB', 'OPERATIONS', true),
  ('Crystal', 'Myers', 'Crystal Myers', 'crystal.myers@sunbeltmodular.com', 'Project Manager', NULL, NULL, NULL, 'SNB', 'OPERATIONS', true),
  ('Michael', 'Caracciolo', 'Michael Caracciolo', 'michael.caracciolo@sunbeltmodular.com', 'Project Manager', NULL, '4808481076', NULL, 'SNB', 'OPERATIONS', true),
  ('Matthew', 'McDaniel', 'Matthew McDaniel', 'matthew.mcdaniel@sunbeltmodular.com', 'Project Manager', NULL, '4808484715', NULL, 'SNB', 'OPERATIONS', true),
  ('Hector', 'Vazquez', 'Hector Vazquez', 'hector.vazquez@sunbeltmodular.com', 'Project Manager', NULL, '2545004038', NULL, 'SNB', 'OPERATIONS', true),

  -- Engineering
  ('Lois', 'Plymale', 'Lois Plymale', 'lois.plymale@sunbeltmodular.com', 'Architect', '3527282930', '3527741679', NULL, 'SNB', 'ENGINEERING', true),
  ('Michael', 'Grimes', 'Michael Grimes', 'michael.grimes@sunbeltmodular.com', 'Lead Drafter', NULL, '3529103963', NULL, 'SNB', 'DRAFTING', true),
  ('Shaylon', 'Vaughn', 'Shaylon Vaughn', 'shaylon.vaughn@sunbeltmodular.com', 'Director of Engineering', NULL, '6232023528', NULL, 'SNB', 'ENGINEERING', true),
  ('Jasmin', 'Vicente', 'Jasmin Vicente', 'jasmin.vicente@sunbeltmodular.com', 'Engineer', NULL, '4255011234', NULL, 'SNB', 'ENGINEERING', true),
  ('Valerie', 'Eskelsen', 'Valerie Eskelsen', 'valerie.eskelsen@sunbeltmodular.com', 'Engineer', NULL, NULL, NULL, 'SNB', 'ENGINEERING', true),
  ('Louis', 'Cribb', 'Louis Cribb', 'louis.cribb@sunbeltmodular.com', 'Engineer', NULL, '5749033610', NULL, 'SNB', 'ENGINEERING', true),
  ('Robert', 'Berry', 'Robert Berry', 'robert.berry@sunbeltmodular.com', 'Engineer', NULL, '6028267014', NULL, 'SNB', 'ENGINEERING', true),
  ('Roger', 'DeChavez', 'Roger DeChavez', 'roger.dechavez@sunbeltmodular.com', 'Engineer', NULL, '4806479242', NULL, 'SNB', 'ENGINEERING', true),
  ('Mark', 'Lindsay', 'Mark Lindsay', 'mark.lindsay@sunbeltmodular.com', 'Plan Examiner', NULL, '4804079519', NULL, 'SNB', 'ENGINEERING', true),

  -- Drafting
  ('Michael', 'Schneider', 'Michael Schneider', 'michael.schneider@sunbeltmodular.com', 'Director of Drafting', '6024476460', '2144356267', '115', 'SNB', 'DRAFTING', true),
  ('Valerie', 'Edmond', 'Valerie Edmond', 'valerie.edmond@sunbeltmodular.com', 'Drafting Manager - Eastern Region', '6024476460', '4804275330', NULL, 'SNB', 'DRAFTING', true),
  ('Russ', 'Kory', 'Russ Kory', 'russ.kory@sunbeltmodular.com', 'Drafting Manager - West Region', '6024476460', '4808885037', '132', 'SNB', 'DRAFTING', true),
  ('Kyle', 'Nissen', 'Kyle Nissen', 'kyle.nissen@sunbeltmodular.com', 'Drafter', '6024476460', NULL, '131', 'SNB', 'DRAFTING', true),
  ('Rafael', 'Quiros', 'Rafael Quiros', 'rafael.quiros@sunbeltmodular.com', 'Drafter', '6024476460', NULL, '107', 'SNB', 'DRAFTING', true),
  ('Christopher', 'Burgos', 'Christopher Burgos', 'chris.burgos@sunbeltmodular.com', 'Drafter', '8174471213', NULL, '5807', 'SNB', 'DRAFTING', true),
  ('Lemon', 'Henry', 'Lemon Henry', 'lemon.henry@sunbeltmodular.com', 'Drafter', '6024476460', NULL, '133', 'SNB', 'DRAFTING', true),

  -- Safety & Warranty
  ('Marci', 'Mitchell', 'Marci Mitchell', 'marci.mitchell@sunbeltmodular.com', 'Director of Safety & Warranty', '6024476460', '6028030507', '101', 'SNB', 'SAFETY', true),
  ('Greg', 'Berry', 'Greg Berry', 'greg.berry@sunbeltmodular.com', 'Technical Support Manager', NULL, '8175577870', NULL, 'SNB', 'SERVICE', true);

-- ============================================================================
-- AMT (Amtex Modular - Garland, TX)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Noel', 'Lindsey', 'Noel Lindsey', 'noel.lindsey@amtexcorp.com', 'Plant General Manager', '9722767626', '2144500546', '107', 'AMT', 'EXECUTIVE', true),
  ('Darian', 'Curry', 'Darian Curry', 'darian.curry@amtexcorp.com', 'Accounting Manager', '9722767626', '4697240141', '110', 'AMT', 'ACCOUNTING', true),
  ('Lucero', 'Martinez', 'Lucero Martinez', 'lucero.martinez@amtexcorp.com', 'Accounts Payable', '9722767626', NULL, '102', 'AMT', 'ACCOUNTING', true),
  ('Michelle', 'Ponce', 'Michelle Ponce', 'michelle.ponce@amtexcorp.com', 'Administrative Assistant', '9722767626', NULL, '100', 'AMT', 'HR', true),
  ('Kelly', 'Kellie', 'Kelly Kellie', 'kelly.kellie@amtexcorp.com', 'Sales Manager', '9722767626', '4694169979', '103', 'AMT', 'SALES', true),
  ('Liz', 'Ramirez', 'Liz Ramirez', 'liz.ramirez@amtexcorp.com', 'Estimator', '9722767626', NULL, '105', 'AMT', 'SALES', true),
  ('Dyonatan', 'Cysz', 'Dyonatan Cysz', 'dyonatan.cysz@amtexcorp.com', 'Estimator', '9722767626', NULL, '112', 'AMT', 'SALES', true),
  ('Luis', 'Resendiz', 'Luis Resendiz', 'luis.resendiz@amtexcorp.com', 'Production Manager', '9722767626', '2147344582', '117', 'AMT', 'PRODUCTION', true),
  ('Humberto', 'Mendez', 'Humberto Mendez', 'humberto.mendez@amtexcorp.com', 'Production Supervisor', '9722767626', '2145519754', '109', 'AMT', 'PRODUCTION', true),
  ('Tommy', 'Garcia', 'Tommy Garcia', 'tommy.garcia@amtexcorp.com', 'Purchasing Manager', '9722767626', '4696905288', '115', 'AMT', 'PURCHASING', true),
  ('David', 'Flores', 'David Flores', 'david.flores@amtexcorp.com', 'Purchasing Assistant', '9722767626', '9727680062', '104', 'AMT', 'PURCHASING', true),
  ('Walter', 'Portillo', 'Walter Portillo', 'walter.portillo@amtexcorp.com', 'Material Control Supervisor', '9722767626', NULL, '104', 'AMT', 'PRODUCTION', true),
  ('Alexander', 'Fontenarosa', 'Alexander Fontenarosa', 'alex.fontenarosa@amtexcorp.com', 'Project Coordinator', '9722767626', NULL, '113', 'AMT', 'OPERATIONS', true),
  ('Edward', 'Vrzalik', 'Edward Vrzalik', 'edward.vrzalik@amtexcorp.com', 'Drafting Manager', '9722767626', NULL, '108', 'AMT', 'DRAFTING', true),
  ('Rochelle', 'Da Costa', 'Rochelle Da Costa', 'rochelle.costa@amtexcorp.com', 'Drafter', '9722767626', NULL, '108', 'AMT', 'DRAFTING', true),
  ('Roy', 'Thompson', 'Roy Thompson', 'roy.thompson@amtexcorp.com', 'Quality Assurance Manager', '9722767626', '2145511936', '106', 'AMT', 'QUALITY', true),
  ('John', 'Mellet', 'John Mellet', 'john.mellett@amtexcorp.com', 'Safety Coordinator', '9722767626', '2149300127', NULL, 'AMT', 'SAFETY', true),
  ('Jose', 'Contreras', 'Jose Contreras', 'jose.contreras@amtexcorp.com', 'AMP Coordinator', '9722767626', '9729550371', NULL, 'AMT', 'PRODUCTION', true),
  ('Gabriel', 'Sanchez', 'Gabriel Sanchez', 'gabriel.sanchez@amtexcorp.com', 'Weld Shop Manager', NULL, '2145510964', NULL, 'AMT', 'PRODUCTION', true);

-- ============================================================================
-- NWBS (Northwest Building Systems - Boise, ID)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Ross', 'Parks', 'Ross Parks', 'ross.parks@nwbsinc.com', 'Plant General Manager', '2083443527', '2088663615', NULL, 'NWBS', 'EXECUTIVE', true),
  ('Jenn', 'Parks', 'Jenn Parks', 'jenn.parks@nwbsinc.com', 'Accounting Manager', '2083443527', '2088602719', NULL, 'NWBS', 'ACCOUNTING', true),
  ('Alondra', 'Vargas', 'Alondra Vargas', 'alondra.vargas@nwbsinc.com', 'HR/Payroll Specialist', '2083443527', NULL, NULL, 'NWBS', 'HR', true),
  ('Jennifer', 'Lonergan', 'Jennifer Lonergan', 'jennifer.lonergan@nwbsinc.com', 'Office Admin/AP', '2083443527', NULL, '0', 'NWBS', 'ACCOUNTING', true),
  ('Mitch', 'Quintana', 'Mitch Quintana', 'mitch.quintana@nwbsinc.com', 'Sales Manager', '2083443527', '2088602582', NULL, 'NWBS', 'SALES', true),
  ('Robert', 'Thaler', 'Robert Thaler', 'robert.thaler@nwbsinc.com', 'Estimator', '2083443527', '2088602763', NULL, 'NWBS', 'SALES', true),
  ('Justin', 'Downing', 'Justin Downing', 'justin.downing@nwbsinc.com', 'Production Manager', '2083443527', '2087139828', '9', 'NWBS', 'PRODUCTION', true),
  ('Steve', 'Cummings', 'Steve Cummings', 'steve.cummings@nwbsinc.com', 'Plant Manager 1', '2083443527', NULL, NULL, 'NWBS', 'PRODUCTION', true),
  ('Ronnie', 'Ludquist', 'Ronnie Ludquist', 'ronald.lundquist@nwbsinc.com', 'Plant Manager 2', '2083443527', NULL, NULL, 'NWBS', 'PRODUCTION', true),
  ('Russ', 'Metzger', 'Russ Metzger', 'russ.metzger@nwbsinc.com', 'Purchasing Manager', '2083443527', '2088674781', '1', 'NWBS', 'PURCHASING', true),
  ('Justin', 'Weast', 'Justin Weast', 'justin.weast@nwbsinc.com', 'Purchasing Assistant', '2083443527', '2086059974', '7', 'NWBS', 'PURCHASING', true),
  ('Cassey', 'Brandon', 'Cassey Brandon', 'cassey.brandon@nwbsinc.com', 'Material Control', '2083443527', '2085765325', NULL, 'NWBS', 'PRODUCTION', true),
  ('Kelly', 'Daniels', 'Kelly Daniels', 'kelly.daniels@nwbsinc.com', 'Drafter', '2083443527', '2084841662', NULL, 'NWBS', 'DRAFTING', true),
  ('James', 'McLeod', 'James McLeod', 'james.mcleod@nwbsinc.com', 'Drafter', '2083443527', NULL, NULL, 'NWBS', 'DRAFTING', true),
  ('Trent', 'Thomson', 'Trent Thomson', 'trent.thomson@nwbsinc.com', 'Quality Assurance Manager', '2083443527', '2084051197', NULL, 'NWBS', 'QUALITY', true),
  ('Jeff', 'Murray', 'Jeff Murray', 'jeff.murray@nwbsinc.com', 'Safety Coordinator', '2083443527', '2085737322', NULL, 'NWBS', 'SAFETY', true),
  ('Steve', 'Jackman', 'Steve Jackman', 'Steven.Jackman@nwbsinc.com', 'QC/Transport Supervisor', '2083443527', NULL, NULL, 'NWBS', 'QUALITY', true),
  ('Sepp', 'Braun', 'Sepp Braun', 'sepp.braun@nwbsinc.com', 'Service Technician', '2083443527', '2089688710', '8', 'NWBS', 'SERVICE', true),
  ('Jerad', 'Martindale', 'Jerad Martindale', 'jerad.martindale@nwbsinc.com', 'Maintenance', '2083443527', '2088413865', NULL, 'NWBS', 'PRODUCTION', true);

-- ============================================================================
-- PMI (Phoenix Modular Industries)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Monty', 'King', 'Monty King', 'monty.king@phoenixmodular.com', 'Plant General Manager', '6024476460', '6023274771', '116', 'PMI', 'EXECUTIVE', true),
  ('Amber', 'Chase', 'Amber Chase', 'amber.chase@phoenixmodular.com', 'Plant Accounting Manager', '6024476460', '6053765322', '306', 'PMI', 'ACCOUNTING', true),
  ('Susie', 'Ayala', 'Susie Ayala', 'susie.ayala@phoenixmodular.com', 'HR/Payroll Specialist', '6024476460', NULL, '120', 'PMI', 'HR', true),
  ('Melanie', 'Kenyon', 'Melanie Kenyon', 'melanie.kenyon@phoenixmodular.com', 'A/P Specialist', '6024476460', NULL, '128', 'PMI', 'ACCOUNTING', true),
  ('Sonia', 'Quezada', 'Sonia Quezada', 'sonia.quezada@phoenixmodular.com', 'Administrative Assistant', '6024476460', NULL, '100', 'PMI', 'HR', true),
  ('Brian', 'Shackleford', 'Brian Shackleford', 'brian.shackleford@phoenixmodular.com', 'Sales Manager', '6024476460', '6023975474', '105', 'PMI', 'SALES', true),
  ('Angela', 'Perillo', 'Angela Perillo', 'angela.perillo@phoenixmodular.com', 'Sales & Estimating', '6024476460', NULL, '127', 'PMI', 'SALES', true),
  ('Chris', 'Thomas', 'Chris Thomas', 'chris.thomas@sunbeltmodular.com', 'Sales & Estimating', '6024476460', NULL, '136', 'PMI', 'SALES', true),
  ('Dominic', 'Delucia', 'Dominic Delucia', 'dominic.delucia@phoenixmodular.com', 'Sales & Estimating', '6024476460', NULL, NULL, 'PMI', 'SALES', true),
  ('Rafael', 'Quiros', 'Rafael Quiros', 'rafael.quiros@phoenixmodular.com', 'Production Manager', '6024476460', '6023206044', '135', 'PMI', 'PRODUCTION', true),
  ('Sam', 'Murillo', 'Sam Murillo', 'sam.murillo@phoenixmodular.com', 'Purchasing Manager', '6024476460', '6028030066', '113', 'PMI', 'PURCHASING', true),
  ('Mariana', 'Martinez', 'Mariana Martinez', 'mariana.martinez@phoenixmodular.com', 'Purchasing Assistant', '6024476460', NULL, '126', 'PMI', 'PURCHASING', true),
  ('Ramon', 'Armenta', 'Ramon Armenta', 'ramon.armenta@phoenixmodular.com', 'Purchasing Assistant', '6024476460', NULL, '137', 'PMI', 'PURCHASING', true),
  ('Dawn', 'Lesser', 'Dawn Lesser', 'dawn.lesser@phoenixmodular.com', 'Material Control Foreman', '6024476460', '6026002544', '118', 'PMI', 'PRODUCTION', true),
  ('Jessica', 'Flores', 'Jessica Flores', 'jessica.flores@phoenixmodular.com', 'Receiving Data Entry Clerk', '6024476460', NULL, '110', 'PMI', 'PRODUCTION', true),
  ('Juanita', 'Earnest', 'Juanita Earnest', 'juanita.earnest@phoenixmodular.com', 'Project Coordinator Supervisor', '6024476460', NULL, '121', 'PMI', 'OPERATIONS', true),
  ('Rodrigo', 'Mejia', 'Rodrigo Mejia', 'rodrigo.mejia@phoenixmodular.com', 'Drafting Manager', '6024476460', NULL, '107', 'PMI', 'DRAFTING', true),
  ('Cody', 'King', 'Cody King', 'cody.king@phoenixmodular.com', 'Drafter', '6024476460', NULL, '125', 'PMI', 'DRAFTING', true),
  ('Cristobal', 'Lizarraga', 'Cristobal Lizarraga', 'cristobal.lizarraga@phoenixmodular.com', 'Drafter', '6024476460', NULL, '125', 'PMI', 'DRAFTING', true),
  ('Shawn', 'Stroh', 'Shawn Stroh', 'shawn.stroh@phoenixmodular.com', '(Interim) Quality Assurance Manager', '6024476460', '6023305439', '123', 'PMI', 'QUALITY', true),
  ('Alex', 'Alvarado Moreno', 'Alex Alvarado Moreno', 'alexis.alvarado@phoenixmodular.com', 'QC/Transport Supervisor', '6024476460', '4807208795', '109', 'PMI', 'QUALITY', true),
  ('Donald', 'Hull', 'Donald Hull', 'don.hull@phoenixmodular.com', 'Safety Coordinator', '6024476460', NULL, '130', 'PMI', 'SAFETY', true);

-- ============================================================================
-- SMM (Southeast Modular Manufacturing - Leesburg, FL)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Joe', 'Reid', 'Joe Reid', 'joe.reid@southeastmodular.com', 'Plant General Manager', '3527282930', '2143368582', '301', 'SMM', 'EXECUTIVE', true),
  ('Nancy', 'Davis', 'Nancy Davis', 'nancy.davis@southeastmodular.com', 'Accounting Manager', '3527282930', '3524466978', '328', 'SMM', 'ACCOUNTING', true),
  ('Suzie', 'Nelson', 'Suzie Nelson', 'suzie.nelson@southeastmodular.com', 'HR Specialist', '3527282930', '3522507820', '314', 'SMM', 'HR', true),
  ('Patti', 'Friberg', 'Patti Friberg', 'patti.friberg@southeastmodular.com', 'Accounts Payable', '3527282930', NULL, '300', 'SMM', 'ACCOUNTING', true),
  ('Don', 'Eisman', 'Don Eisman', 'don.eisman@southeastmodular.com', 'Sales Manager', '3527282930', '5743337089', '326', 'SMM', 'SALES', true),
  ('Roger', 'Diamond', 'Roger Diamond', 'roger.diamond@southeastmodular.com', 'Estimating', '3527282930', NULL, '335', 'SMM', 'SALES', true),
  ('Shawn', 'Durante', 'Shawn Durante', 'shawn.durante@southeastmodular.com', 'Estimating', '3527282930', NULL, '324', 'SMM', 'SALES', true),
  ('Mike', 'Stoica', 'Mike Stoica', 'mike.stoica@southeastmodular.com', 'Production Manager', '3527282930', '3524466482', '313', 'SMM', 'PRODUCTION', true),
  ('Cindy', 'Barnes', 'Cindy Barnes', 'cindy.barnes@southeastmodular.com', 'Assist. Production Manager', '3527282930', '3528092558', '305', 'SMM', 'PRODUCTION', true),
  ('Steve', 'Dudley', 'Steve Dudley', 'steve.dudley@southeastmodular.com', 'Purchasing Manager', '3527282930', '3525160631', '310', 'SMM', 'PURCHASING', true),
  ('Corey', 'Abbott', 'Corey Abbott', 'corey.abbott@southeastmodular.com', 'Purchasing Agent', '3527282930', '3523487590', '334', 'SMM', 'PURCHASING', true),
  ('Dave', 'McEwen', 'Dave McEwen', 'dave.mcewen@southeastmodular.com', 'Material Control', '3527282930', '3526032011', '315', 'SMM', 'PRODUCTION', true),
  ('Katie', 'Myers', 'Katie Myers', 'katie.myers@southeastmodular.com', 'Project Coordinator', '3527282930', '3526263577', '312', 'SMM', 'OPERATIONS', true),
  ('Chris', 'Smith', 'Chris Smith', 'chris.smith@southeastmodular.com', 'Drafting Manager', '3527282930', NULL, '307', 'SMM', 'DRAFTING', true),
  ('Otha', 'Matthews', 'Otha Matthews', 'tommy.matthews@southeastmodular.com', 'Drafter', '3527282930', NULL, '307', 'SMM', 'DRAFTING', true),
  ('Zachary', 'Esguerra', 'Zachary Esguerra', 'zachary.esguerra@southeastmodular.com', 'Drafter', '3527282930', NULL, '307', 'SMM', 'DRAFTING', true),
  ('Daniel', 'Lemusmora', 'Daniel Lemusmora', 'daniel.lemusmora@southeastmodular.com', 'Quality Assurance Manager', '3527282930', '3529103963', '302', 'SMM', 'QUALITY', true);

-- ============================================================================
-- WM-EVERGREEN (Whitley Evergreen - Marysville, WA)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Randy', 'Maddox', 'Randy Maddox', 'randymaddox@whitleyman.com', 'General Manager', '3606535790', NULL, '23', 'WM-EVERGREEN', 'EXECUTIVE', true),
  ('Kali', 'Partridge', 'Kali Partridge', 'kalipartridge@whitleyman.com', 'HR/Admin', '3606535790', NULL, '10', 'WM-EVERGREEN', 'HR', true),
  ('Hank', 'Kennedy', 'Hank Kennedy', 'hankkennedy@whitleyman.com', 'Estimating', '3606535790', NULL, '18', 'WM-EVERGREEN', 'SALES', true),
  ('Clint', 'Williams', 'Clint Williams', 'clintwilliams@whitleyman.com', 'Production Manager', '3606535790', NULL, '26', 'WM-EVERGREEN', 'PRODUCTION', true),
  ('Walt', 'Hylback', 'Walt Hylback', 'walthylback@whitleyman.com', 'Purchasing Manager', '3606535790', NULL, '24', 'WM-EVERGREEN', 'PURCHASING', true),
  ('Alysha', 'Lantz', 'Alysha Lantz', 'alyshalantz@whitleyman.com', 'Accts Receivable/Purchasing', '3606535790', NULL, '21', 'WM-EVERGREEN', 'ACCOUNTING', true),
  ('Mike', 'Perry', 'Mike Perry', 'mikeperry@whitleyman.com', 'Design Manager', '3606535790', NULL, '22', 'WM-EVERGREEN', 'DRAFTING', true),
  ('Tina', 'Bach', 'Tina Bach', 'tinabach@whitleyman.com', 'Drafting Assistant', '3606535790', NULL, '14', 'WM-EVERGREEN', 'DRAFTING', true),
  ('Nicole', 'Gruendl', 'Nicole Gruendl', 'nicolegruendl@whitleyman.com', 'Assistant Project Manager', '3606535790', NULL, '19', 'WM-EVERGREEN', 'OPERATIONS', true),
  ('Mike', 'Soley', 'Mike Soley', 'mikesoley@whitleyman.com', 'QA/QC Manager', '3606535790', NULL, '26', 'WM-EVERGREEN', 'QUALITY', true);

-- ============================================================================
-- WM-EAST (Whitley East - Leola, PA)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Joe', 'Dattoli', 'Joe Dattoli', 'JoeDattoli@whitleyman.com', 'General Manager', '7176562081', '7178261711', '470', 'WM-EAST', 'EXECUTIVE', true),
  ('Don', 'Engle', 'Don Engle', 'DonEngle@whitleyman.com', '(assisting new GM)', '7176562081', '7175875252', NULL, 'WM-EAST', 'EXECUTIVE', true),
  ('Tracy', 'Lagaza', 'Tracy Lagaza', 'TracyLagaza@whitleyman.com', 'Office Manager, QA Admin.', '7176562081', '7176698422', '400', 'WM-EAST', 'OPERATIONS', true),
  ('Kristin', 'Garber', 'Kristin Garber', 'KristinGarber@whitleyman.com', 'HR', '7176562081', '6106794548', '430', 'WM-EAST', 'HR', true),
  ('Christine', 'Kline', 'Christine Kline', 'ChristineKline@whitleyman.com', 'Sales/Estimating', '7176562081', '6102230507', '450', 'WM-EAST', 'SALES', true),
  ('Steve', 'Adams', 'Steve Adams', 'EastSupv@whitleyman.com', 'Supervisor (plant 1)', '7176562081', '7176066753', '481', 'WM-EAST', 'PRODUCTION', true),
  ('Mike', 'Greiner', 'Mike Greiner', 'EastSupv@whitleyman.com', 'Supervisor (plant 1)', '7176562081', '7174725150', '481', 'WM-EAST', 'PRODUCTION', true),
  ('Sammy', 'Reyes-Ramos', 'Sammy Reyes-Ramos', 'SammyRamos@whitleyman.com', 'Supervisor (plant 2)', '7176562081', '7178261528', '487', 'WM-EAST', 'PRODUCTION', true),
  ('Ethan', 'Paul', 'Ethan Paul', 'EthanPaul@whitleyman.com', 'Engineering/Design/IT', '7176562081', '5704155358', '440', 'WM-EAST', 'ENGINEERING', true),
  ('Blaine', 'Brillhart', 'Blaine Brillhart', 'BlaineBrillhart@whitleyman.com', 'Drafter', '7176562081', '7178049100', '441', 'WM-EAST', 'DRAFTING', true),
  ('JC', 'Redmond', 'JC Redmond', 'JCRedmond@whitleyman.com', 'Project Manager', '7176562081', '7178753732', '460', 'WM-EAST', 'OPERATIONS', true),
  ('Craig', 'Smith', 'Craig Smith', 'CraigSmith@whitleyman.com', 'Purchaser Manager', '7176562081', '7175724596', '421', 'WM-EAST', 'PURCHASING', true),
  ('Robert', 'Frankfort', 'Robert Frankfort', 'RobertFrankfort@whitleyman.com', 'Purchaser', '7176562081', '2237970202', '420', 'WM-EAST', 'PURCHASING', true),
  ('Bill', 'Stover', 'Bill Stover', 'EastReceiving@whitleyman.com', 'Receiving Manager', '7176562081', '7172091795', '422', 'WM-EAST', 'PRODUCTION', true),
  ('Randy', 'Gibson', 'Randy Gibson', 'EastMaintenance@whitleyman.com', 'Maintenance Manager', '7176562081', '7179470316', '482', 'WM-EAST', 'PRODUCTION', true),
  ('Kevin', 'Stauffer', 'Kevin Stauffer', 'EastQA2@whitleyman.com', 'QA Manager', '7176562081', '6105852881', '412', 'WM-EAST', 'QUALITY', true),
  ('Dylan', 'Loper', 'Dylan Loper', 'DylanLoper@whitleyman.com', 'Operations Manager', '7176562081', '7178812728', '410', 'WM-EAST', 'OPERATIONS', true),
  ('Jose', 'Nogueras', 'Jose Nogueras', 'JoseNogueras@whitleyman.com', 'Operations Manager', '7176562081', '7173277785', '480', 'WM-EAST', 'OPERATIONS', true);

-- ============================================================================
-- WM-SOUTH (Whitley South - South Whitley, IN)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Simon', 'Dragan', 'Simon Dragan', 'SimonDragan@whitleyman.com', 'CEO', '2607235131', '2604500264', '218', 'WM-SOUTH', 'EXECUTIVE', true),
  ('Drew', 'Welborn', 'Drew Welborn', 'DrewWelborn@whitleyman.com', 'President', '2607235131', '2604505904', '204', 'WM-SOUTH', 'EXECUTIVE', true),
  ('Jeff', 'Zukowski', 'Jeff Zukowski', 'JeffZukowski@whitleyman.com', 'Continuous Improvement', '2607235131', '3314449513', '221', 'WM-SOUTH', 'OPERATIONS', true),
  ('Bob', 'Jones', 'Bob Jones', 'BobJones@whitleyman.com', 'VP Finance', '2607235131', '2607502948', '219', 'WM-SOUTH', 'ACCOUNTING', true),
  ('Laurie', 'England', 'Laurie England', 'LaurieEnglang@whileyman.com', 'HR/Payroll', '2607235131', '2603778292', '203', 'WM-SOUTH', 'HR', true),
  ('Stacey', 'Blain', 'Stacey Blain', 'StaceyBlain@whitleyman.com', 'Accounts Payable', '2607235131', '2602139910', '208', 'WM-SOUTH', 'ACCOUNTING', true),
  ('Anne', 'Scarano', 'Anne Scarano', 'AnneScarano@whitleyman.com', 'Receptionist/Accounts Payable', '2607235131', '2177798956', '200', 'WM-SOUTH', 'ACCOUNTING', true),
  ('William', 'Mann', 'William Mann', 'WillMann@whitleyman.com', 'VP Vertical Marketing', '2607235131', '7047190509', NULL, 'WM-SOUTH', 'SALES', true),
  ('Dan', 'Lipinski', 'Dan Lipinski', 'DanLipinski@whitleyman.com', 'Estimator', '2607235131', '2604099614', '212', 'WM-SOUTH', 'SALES', true),
  ('Larry', 'High', 'Larry High', 'LarryHigh@whitleyman.com', 'Estimator (retired)', '2607235131', '2606020504', '213', 'WM-SOUTH', 'SALES', true),
  ('Garett', 'Simmons', 'Garett Simmons', 'GarettSimmons@whitleyman.com', 'Estimator Project Mgr', '2607235131', '2602296131', '228', 'WM-SOUTH', 'SALES', true),
  ('Dan', 'Schuhler', 'Dan Schuhler', 'DanScuhler@whitleyman.com', 'Project Mgr/Estimator', '2607235131', '2604138950', '283', 'WM-SOUTH', 'OPERATIONS', true),
  ('Don', 'Harlan', 'Don Harlan', 'DonHarlan@whitleyman.com', 'Plant Manager', '2607235131', '5745270371', '222', 'WM-SOUTH', 'PRODUCTION', true),
  ('Kevin', 'Henning', 'Kevin Henning', 'KevinHenning@whitleyman.com', 'Supervisor A & B', '2607235731', '2603121171', '262', 'WM-SOUTH', 'PRODUCTION', true),
  ('Bryce', 'Bender', 'Bryce Bender', 'BryceBender@whitleyman.com', 'Supervisor C', '2607235131', '2605306728', '230', 'WM-SOUTH', 'PRODUCTION', true),
  ('Gage', 'Benson', 'Gage Benson', 'GageBenson@whitleyman.com', 'Purchasing', '2607235131', '2604095471', '209', 'WM-SOUTH', 'PURCHASING', true),
  ('Tim', 'Kelsey', 'Tim Kelsey', 'TimKelsey@whitleyman.com', 'Purchasing', '2607235131', '5749306150', '202', 'WM-SOUTH', 'PURCHASING', true),
  ('Elena', 'Harris', 'Elena Harris', 'ElenaHarrisg@whileyman.com', 'QC/Purchasing', '2607235131', '2604183262', '227', 'WM-SOUTH', 'QUALITY', true),
  ('Adam', 'Parker', 'Adam Parker', 'AdamParker@whitleyman.com', 'Drafting', '2607235131', '2605031481', '229', 'WM-SOUTH', 'DRAFTING', true),
  ('Richard', 'Harlan', 'Richard Harlan', 'RichardHarlan@whitleyman.com', 'Drafting', '2607235131', '2605683214', '225', 'WM-SOUTH', 'DRAFTING', true),
  ('Anthony', 'Hedglen', 'Anthony Hedglen', 'AnthonyHedglen@whitleyman.com', 'Drafting', '2607235131', '5743509096', '281', 'WM-SOUTH', 'DRAFTING', true),
  ('Rebecca', 'Martin', 'Rebecca Martin', 'RebeccaMartin@whitleyman.com', 'Drafting', '2607235131', '2602736132', '282', 'WM-SOUTH', 'DRAFTING', true),
  ('Kalah', 'Siler', 'Kalah Siler', 'KalahSiler@whitleyman.com', 'Drafting', '2607235131', '3607088667', '224', 'WM-SOUTH', 'DRAFTING', true),
  ('Taylor', 'Tullis', 'Taylor Tullis', 'TaylorTullis@whitleyman.com', 'Drafting', '2607235131', '5132930541', NULL, 'WM-SOUTH', 'DRAFTING', true),
  ('Crystal', 'Lee', 'Crystal Lee', 'CrystalLee@whitleyman.com', 'Systems Coordinator', '2607235131', '5184198276', '210', 'WM-SOUTH', 'IT', true),
  ('Joshua', 'Rhodes', 'Joshua Rhodes', 'JoshuaRhodes@whitleyman.com', 'QC', '2607235131', '5742489602', NULL, 'WM-SOUTH', 'QUALITY', true);

-- ============================================================================
-- WM-ROCHESTER (Whitley Rochester - Rochester, IN)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Kole', 'Kroft', 'Kole Kroft', 'KoleKroft@whitleyman.com', 'General Manager', '5742234934', '2198633733', '109', 'WM-ROCHESTER', 'EXECUTIVE', true),
  ('Kerry', 'Nelson', 'Kerry Nelson', 'kerrynelson@whitleyman.com', 'HR/Recruiting', '5742234934', '5748350602', '106', 'WM-ROCHESTER', 'HR', true),
  ('Beth', 'Balser', 'Beth Balser', 'bethbalser@whitleyman.com', 'Receptionist/Admin.Asst.', '5742234934', '5748471352', '101', 'WM-ROCHESTER', 'HR', true),
  ('Rob', 'Farris', 'Rob Farris', 'RobFarris@whitleyman.com', 'Production Manager P1', '5742234934', '5742018691', '108', 'WM-ROCHESTER', 'PRODUCTION', true),
  ('Jose', 'Jimenez', 'Jose Jimenez', 'josejimenez@whitleyman.com', 'Production Manager P2', '5742234934', '6309150858', '111', 'WM-ROCHESTER', 'PRODUCTION', true),
  ('Linda', 'Martin', 'Linda Martin', 'LindaMartin@whitleyman.com', 'Purchasing Manager', '5742234934', '5747212592', '128', 'WM-ROCHESTER', 'PURCHASING', true),
  ('Ruth', 'Music', 'Ruth Music', 'RuthMusic@whitleyman.com', 'Purchasing Agent', '5742234934', '2602272295', '105', 'WM-ROCHESTER', 'PURCHASING', true),
  ('Lisa', 'Weissert', 'Lisa Weissert', 'LisaWeissert@whitleyman.com', 'Systems Coordinator', '5742234934', '5747075844', '107', 'WM-ROCHESTER', 'IT', true),
  ('Benjamin', 'Wilson', 'Benjamin Wilson', 'BenjaminWilson@whitleyman.com', 'Draftsman', '5742234934', '9124928425', '110', 'WM-ROCHESTER', 'DRAFTING', true),
  ('Whitney', 'Farris', 'Whitney Farris', 'WhitneyFarris@whitleyman.com', 'Quality Control Manager', '5742234934', '5742303891', '102', 'WM-ROCHESTER', 'QUALITY', true),
  ('Vince', 'Mettler', 'Vince Mettler', 'MBI.QC.Plant2@whitleyman.com', 'Quality Control P2', '5742234934', '7654692240', '113', 'WM-ROCHESTER', 'QUALITY', true);

-- ============================================================================
-- SSI (Specialized Structures - Willacoochee, GA)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Glenn', 'Gardner', 'Glenn Gardner', 'glenn.gardner@specializedstructures.com', 'Plant General Manager', '9125346111', '9125346111', NULL, 'SSI', 'EXECUTIVE', true),
  ('Peggy', 'Forest', 'Peggy Forest', 'peggy.forest@specializedstructures.com', 'Accounting Manager', '9125346111', '9123100878', NULL, 'SSI', 'ACCOUNTING', true),
  ('Vaneza', 'Aguilar', 'Vaneza Aguilar', 'vaneza.aguilar@specializedstructures.com', 'Accounts Payable', '9125346111', NULL, NULL, 'SSI', 'ACCOUNTING', true),
  ('Fatima', 'Corona', 'Fatima Corona', 'fatima.corona@specializedstructures.com', 'HR/Payroll Specialist', '9125346111', NULL, NULL, 'SSI', 'HR', true),
  ('Josh', 'Ellis', 'Josh Ellis', 'josh.ellis@specializedstructures.com', 'Sales Manager', '9125346111', '9123270256', NULL, 'SSI', 'SALES', true),
  ('Derek', 'Little', 'Derek Little', 'derek.little@specializedstructures.com', 'Estimator', '9125346111', '9123098056', NULL, 'SSI', 'SALES', true),
  ('Josh', 'Polk', 'Josh Polk', 'josh.polk@specializedstructures.com', 'Estimator', '9125346111', '9125923882', NULL, 'SSI', 'SALES', true),
  ('Grant', 'Gardner', 'Grant Gardner', 'grant.gardner@specializedstructures.com', 'Production Manager', '9125346111', '9123099603', NULL, 'SSI', 'PRODUCTION', true),
  ('Charlie', 'Bennett', 'Charlie Bennett', 'charlie.bennett@specializedstructures.com', 'Purchasing Manager', '9125346111', '9123812063', NULL, 'SSI', 'PURCHASING', true),
  ('Kenneth', 'Haskins', 'Kenneth Haskins', 'kenneth.haskins@specializedstructures.com', 'Purchasing Assistant', '9125346111', NULL, NULL, 'SSI', 'PURCHASING', true),
  ('William', 'Peacock', 'William Peacock', 'william.peacock@specializedstructures.com', 'Material Control', '9125346111', NULL, NULL, 'SSI', 'PRODUCTION', true),
  ('Silvanna', 'Corona', 'Silvanna Corona', 'silvanna.corona@specializedstructures.com', 'Project Coordinator', '9125346111', NULL, NULL, 'SSI', 'OPERATIONS', true),
  ('Tyler', 'Ellis', 'Tyler Ellis', 'tyler.ellis@specializedstructures.com', 'Drafter', '9125346111', NULL, NULL, 'SSI', 'DRAFTING', true),
  ('Gavin', 'Grantham', 'Gavin Grantham', 'gavin.grantham@specializedstructures.com', 'Drafter', '9125346111', NULL, NULL, 'SSI', 'DRAFTING', true),
  ('Kevin', 'Gillespie', 'Kevin Gillespie', 'kevin.gillespie@specializedstructures.com', 'Service Manager', '9125346111', NULL, NULL, 'SSI', 'SERVICE', true),
  ('Dudley', 'Vickers', 'Dudley Vickers', 'dudley.vickers@specializedstructures.com', 'Quality Control', NULL, NULL, NULL, 'SSI', 'QUALITY', true),
  ('Jim', 'Harrell', 'Jim Harrell', 'jim.harrell@specializedstructures.com', 'Quality Control', '9125346111', NULL, NULL, 'SSI', 'QUALITY', true);

-- ============================================================================
-- IBI (Indicom Buildings - Burleson, TX)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone, cell_phone, extension, factory_code, department_code, is_active)
VALUES
  ('Beth', 'Berry', 'Beth Berry', 'beth.berry@indicombuildings.com', 'Plant General Manager', '8174471213', '8179153844', '5814', 'IBI', 'EXECUTIVE', true),
  ('Patsy', 'Mejia', 'Patsy Mejia', 'patsy.mejia@indicombuildings.com', 'Accounting Supervisor', '8174471213', '8173579214', '5835', 'IBI', 'ACCOUNTING', true),
  ('Ashley', 'Fabela', 'Ashley Fabela', 'ashley.fabela@indicombuildings.com', 'HR/Payroll Assistant', '8174471213', NULL, '5802', 'IBI', 'HR', true),
  ('Amy', 'Davila', 'Amy Davila', 'amy.davila@indicombuildings.com', 'Admin. Assistant/A/P', '8174471213', NULL, '5800', 'IBI', 'ACCOUNTING', true),
  ('Levi', 'Porter', 'Levi Porter', 'levi.porter@indicombuildings.com', 'Sales Manager', '8174471213', '6823478050', '5840', 'IBI', 'SALES', true),
  ('Jose', 'Ramirez', 'Jose Ramirez', 'jose.ramirez@indicombuildings.com', 'Sales & Estimating', '8174471213', '8177741181', '5847', 'IBI', 'SALES', true),
  ('Alex', 'Fabela', 'Alex Fabela', 'alex.fabela@indicombuildings.com', 'Sales & Estimating', '8174471213', NULL, '5815', 'IBI', 'SALES', true),
  ('Tiffany', 'Stephens', 'Tiffany Stephens', 'tiffany.stephens@indicombuildings.com', 'Sales & Estimating', '8174471213', NULL, '5806', 'IBI', 'SALES', true),
  ('Frank', 'Saenz', 'Frank Saenz', 'frank.saenz@indicombuildings.com', 'Production Manager', '8174471213', NULL, '5842', 'IBI', 'PRODUCTION', true),
  ('Tichelle', 'Halford', 'Tichelle Halford', 'tichelle.halford@indicombuildings.com', 'Purchasing Manager', '8174471213', NULL, '5824', 'IBI', 'PURCHASING', true),
  ('Andy', 'Love', 'Andy Love', 'andy.love@indicombuildings.com', 'Purchasing Agent', '8174471213', NULL, '5821', 'IBI', 'PURCHASING', true),
  ('Anne', 'Perez', 'Anne Perez', 'anne.perez@indicombuildings.com', 'Material Control', '8174471213', NULL, '5803', 'IBI', 'PRODUCTION', true),
  ('Lisa', 'Linn', 'Lisa Linn', 'lisa.linn@indicombuildings.com', 'Project Coordinator', '8174471213', NULL, '5813', 'IBI', 'OPERATIONS', true),
  ('Matthew', 'Scott', 'Matthew Scott', 'matthew.scott@indicombuildings.com', 'Engineering Manager', '8174471213', '8177741206', '5831', 'IBI', 'ENGINEERING', true),
  ('David', 'Walker', 'David Walker', 'david.walker@indicombuildings.com', 'Architectural Designer', '8174471213', NULL, '5833', 'IBI', 'ENGINEERING', true),
  ('Randy', 'Walker', 'Randy Walker', 'randy.walker@indicombuildings.com', 'Design Drafter', NULL, '6085723867', NULL, 'IBI', 'DRAFTING', true),
  ('Eliud', 'Saenz', 'Eliud Saenz', 'eliud.saenz@indicombuildings.com', 'Design Drafter', '8174471213', NULL, '5804', 'IBI', 'DRAFTING', true),
  ('Gabriel', 'Moreno', 'Gabriel Moreno', 'gabriel.moreno@indicombuildings.com', 'Design Drafter', '8174471213', NULL, '5832', 'IBI', 'DRAFTING', true),
  ('Erik', 'Fabela', 'Erik Fabela', 'erik.fabela@indicombuildings.com', 'Warranty/QC Manager', '8174471213', '8176917954', '5841', 'IBI', 'QUALITY', true),
  ('Nataly', 'Chaidez', 'Nataly Chaidez', 'nataly.chaidez@indicombuildings.com', 'Safety Coordinator', '8174471213', NULL, '5808', 'IBI', 'SAFETY', true),
  ('Jay', 'Stratton', 'Jay Stratton', 'jay.stratton@indicombuildings.com', 'QC/Transportation Supervisor', '8174471213', NULL, '5822', 'IBI', 'QUALITY', true),
  ('Marvin', 'McGahan', 'Marvin McGahan', 'marvin.mcgahan@indicombuildings.com', 'Warranty Service', NULL, '6823185599', NULL, 'IBI', 'SERVICE', true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Directory contacts created:' AS status;
SELECT factory_code, COUNT(*) as contact_count
FROM directory_contacts
WHERE is_active = true
GROUP BY factory_code
ORDER BY factory_code;

SELECT 'Total contacts: ' || COUNT(*) AS total FROM directory_contacts WHERE is_active = true;
