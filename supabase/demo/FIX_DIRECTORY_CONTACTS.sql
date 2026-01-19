-- ============================================================================
-- FIX_DIRECTORY_CONTACTS.sql
-- Populates directory_contacts table from Sunbelt_Directory_Combined.csv
-- Total: 311 contacts across 15 factories
--
-- Run this in Supabase SQL Editor after COMPREHENSIVE_DEMO_DATA.sql
-- ============================================================================

-- Clear existing directory contacts
TRUNCATE TABLE directory_contacts CASCADE;

-- ============================================================================
-- INSERT ALL DIRECTORY CONTACTS (311 total)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, full_name, email, position, phone_main, phone_cell, phone_extension, factory_code, department_code, is_active)
VALUES
  -- ========================================================================
  -- SNB - SUNBELT CORPORATE (72 contacts)
  -- ========================================================================
  ('Ron', 'Procunier', 'Ron Procunier', NULL, 'Chief Executive Officer (CEO)', '6024476460', NULL, NULL, 'SNB', 'EXECUTIVE', true),
  ('Bob', 'Lahmann', 'Bob Lahmann', 'bob.lahmann@sunbeltmodular.com', 'Chief Financial Officer (CFO)', NULL, '4103007926', NULL, 'SNB', 'EXECUTIVE', true),
  ('Gary', 'Davenport', 'Gary Davenport', 'gary.davenport@sunbeltmodular.com', 'Chief Revenue Office (CRO)', NULL, '7046193665', NULL, 'SNB', 'EXECUTIVE', true),
  ('Mitch', 'Marois', 'Mitch Marois', 'mitch.marois@sunbeltmodular.com', 'Director of FP&A', '6024476460', '6025793316', '138', 'SNB', 'ACCOUNTING', true),
  ('Irina', 'Lee', 'Irina Lee', 'irina.lee@sunbeltmodular.com', 'FP&A Analyst', NULL, '6236937203', NULL, 'SNB', 'ACCOUNTING', true),
  ('Dawn', 'Polk', 'Dawn Polk', 'dawn.polk@sunbeltmodular.com', 'Cost Acct Manager - East', NULL, '9123812106', NULL, 'SNB', 'ACCOUNTING', true),
  ('Wendy', 'Li', 'Wendy Li', 'wendy.li@sunbeltmodular.com', 'Corporate Controller', '6024476460', '6029108008', '303', 'SNB', 'ACCOUNTING', true),
  ('Demi', 'Nguyen', 'Demi Nguyen', 'demi.nguyen@sunbeltmodular.com', 'Senior GL Analyst', '6024476460', '6027170801', '302', 'SNB', 'ACCOUNTING', true),
  ('Aina', 'Padasdao', 'Aina Padasdao', 'aina.padasdao@sunbeltmodular.com', 'Staff Accountant', '6024476460', NULL, '301', 'SNB', 'ACCOUNTING', true),
  ('Ibet', 'Murillo', 'Ibet Murillo', 'ibet.murillo@sunbeltmodular.com', 'Vice President of HR & Integration', '6024476460', '6024668456', '112', 'SNB', 'EXECUTIVE', true),
  ('Argelia', 'Gonzalez', 'Argelia Gonzalez', 'argelia.gonzalez@sunbeltmodular.com', 'Benefits/Payroll Supervisor', '6024476460', '6025411021', '124', 'SNB', 'HR', true),
  ('Kaitlyn', 'Pogue', 'Kaitlyn Pogue', 'kaitlyn.pogue@sunbeltmodular.com', 'HR Compliance Specialist', '2087817012', '2088694297', NULL, 'SNB', 'HR', true),
  ('Toni', 'Jacoby', 'Toni Jacoby', 'toni.jacoby@sunbeltmodular.com', 'Director of Marketing', NULL, '6027689265', NULL, 'SNB', 'MARKETING', true),
  ('Ashley', 'Camp', 'Ashley Camp', 'ashley.camp@sunbeltmodular.com', 'Marketing Coordinator & Event Planner', '3527282930', '9289209171', '336', 'SNB', 'MARKETING', true),
  ('Frank', 'Monahan', 'Frank Monahan', 'frank.monahan@sunbeltmodular.com', 'Vice President of Business Development', NULL, '6027934869', NULL, 'SNB', 'EXECUTIVE', true),
  ('Andreas', 'Klinckwort', 'Andreas Klinckwort', 'aklinckwort@britcousa.com', 'Sales Manager - Energy', '2547416701', '2813846072', NULL, 'SNB', 'SALES', true),
  ('Thomas', 'Cassity', 'Thomas Cassity', 'tom.cassity@sunbeltmodular.com', 'Business Development - Healthcare', '3527282930', '3526263313', '321', 'SNB', 'SALES', true),
  ('Desiree', 'Galan', 'Desiree Galan', 'desiree.galan@sunbeltmodular.com', 'Business Development', '6024476460', '6023975465', '102', 'SNB', 'SALES', true),
  ('Edwin', 'Villegas', 'Edwin Villegas', 'edwin.villegas@sunbeltmodular.com', 'Designer', '3527282930', NULL, NULL, 'SNB', 'DRAFTING', true),
  ('Brent', 'Morgan', 'Brent Morgan', 'bmorgan@britcousa.com', 'Vice President of Sales (Central)', '2547416701', '2543138306', NULL, 'SNB', 'EXECUTIVE', true),
  ('Jason', 'King', 'Jason King', 'jason.king@sunbeltmodular.com', 'Sales Manager - Major Projects (Central)', '6024476460', '6027815134', '122', 'SNB', 'SALES', true),
  ('Casey', 'Tanner', 'Casey Tanner', 'casey.tanner@sunbeltmodular.com', 'Vice President of Sales (East)', NULL, '9123812757', NULL, 'SNB', 'EXECUTIVE', true),
  ('Barbara', 'Hicks', 'Barbara Hicks', 'barbara.hicks@sunbeltmodular.com', 'Sales Manager - Major Projects (East)', NULL, '2298158960', NULL, 'SNB', 'SALES', true),
  ('Roger', 'Suggs', 'Roger Suggs', 'roger.suggs@sunbeltmodular.com', 'Sales & Estimating', NULL, '7066816819', NULL, 'SNB', 'SALES', true),
  ('Johnny', 'Haskins', 'Johnny Haskins', 'johnny.haskins@sunbeltmodular.com', 'Sales & Estimating', NULL, '9123935804', NULL, 'SNB', 'SALES', true),
  ('Jay', 'Vanvlerah', 'Jay Vanvlerah', 'jay.vanvlerah@sunbeltmodular.com', 'Vice President of Sales (West)', NULL, '2142074044', NULL, 'SNB', 'EXECUTIVE', true),
  ('Casey', 'Knipp', 'Casey Knipp', 'casey.knipp@sunbeltmodular.com', 'Sales Manager - Major Projects (West)', '6024476460', '6027815208', '106', 'SNB', 'SALES', true),
  ('George', 'Avila', 'George Avila', 'george.avila@sunbeltmodular.com', 'Sales Estimator - Major Projects (West)', NULL, '4806178727', NULL, 'SNB', 'SALES', true),
  ('Leah', 'Curtis', 'Leah Curtis', 'leah.curtis@sunbeltmodular.com', 'Sales & Estimating', '6024476460', '6027816563', '117', 'SNB', 'SALES', true),
  ('Michael', 'Schmid', 'Michael Schmid', 'michael.schmid@sunbeltmodular.com', 'Sales & Estimating', NULL, '7207665759', NULL, 'SNB', 'SALES', true),
  ('Nydia', 'Mora', 'Nydia Mora', 'nydia.mora@phoenixmodular.com', 'Sales & Estimating', '6024476460', NULL, '141', 'SNB', 'SALES', true),
  ('Jay', 'Daniels', 'Jay Daniels', 'jay.daniels@sunbeltmodular.com', 'Vice President of Operations', '6024476460', '6023274768', '129', 'SNB', 'EXECUTIVE', true),
  ('Kim', 'Souvannarath', 'Kim Souvannarath', 'kim.souvannarath@sunbeltmodular.com', 'Estimating & Inventory Systems Manager', '6024476460', '6232610129', '304', 'SNB', 'SALES', true),
  ('Monica', 'Mora', 'Monica Mora', 'monica.mora@sunbeltmodular.com', 'Purchasing Assistant', '6024476460', NULL, '134', 'SNB', 'PURCHASING', true),
  ('David', 'Mejia', 'David Mejia', 'david.mejia@sunbeltmodular.com', 'Vice President of Estimating & Inventory Systems', '6024476460', '6023274770', '104', 'SNB', 'EXECUTIVE', true),
  ('David', 'Sousa', 'David Sousa', 'david.sousa@sunbeltmodular.com', 'IT Manager - West', '6024476460', '6024781531', '139', 'SNB', 'IT', true),
  ('Roy', 'Ray', 'Roy Ray', 'ron.ray@sunbeltmodular.com', 'IT Manager - East', NULL, NULL, NULL, 'SNB', 'IT', true),
  ('Joy', 'Thomas', 'Joy Thomas', 'joy.thomas@sunbeltmodular.com', 'Lead Programmer', NULL, '4806888899', NULL, 'SNB', 'IT', true),
  ('Aaron', 'Olheiser', 'Aaron Olheiser', 'aaron.olheiser@sunbeltmodular.com', 'Network Administrator', NULL, '4805996918', NULL, 'SNB', 'IT', true),
  ('Mark', 'Mirgon', 'Mark Mirgon', 'mark.mirgon@sunbeltmodular.com', 'System Administrator', '6024476460', NULL, '305', 'SNB', 'IT', true),
  ('Frank', 'Delucia', 'Frank Delucia', 'frank.delucia@sunbeltmodular.com', 'Director of Purchasing', '6024476460', '6025824368', '103', 'SNB', 'PURCHASING', true),
  ('Crystal', 'Diaz', 'Crystal Diaz', 'crystal.diaz@sunbeltmodular.com', 'Commodity Specialist', '6024476460', '6234322447', '111', 'SNB', 'PURCHASING', true),
  ('Ryan', 'Mercado', 'Ryan Mercado', 'ryan.mercado@sunbeltmodular.com', 'Purchasing Assistant', '6024476460', NULL, '108', 'SNB', 'PURCHASING', true),
  ('Devin', 'Duvak', 'Devin Duvak', 'devin.duvak@sunbeltmodular.com', 'Vice President of Manufacturing', '8174471213', '8175593737', '5801', 'SNB', 'EXECUTIVE', true),
  ('Joe', 'Hall', 'Joe Hall', 'joe.hall@sunbeltmodular.com', 'Director of Manufacturing (East)', '2299375401', '2299384640', NULL, 'SNB', 'OPERATIONS', true),
  ('Candace', 'Juhnke', 'Candy Juhnke', 'candy.juhnke@sunbeltmodular.com', 'Project Manager', NULL, '6028037224', NULL, 'SNB', 'OPERATIONS', true),
  ('Crystal', 'Myers', 'Crystal Myers', 'crystal.myers@sunbeltmodular.com', 'Project Manager', NULL, NULL, NULL, 'SNB', 'OPERATIONS', true),
  ('Michael', 'Caracciolo', 'Michael Caracciolo', 'michael.caracciolo@sunbeltmodular.com', 'Project Manager', NULL, '4808481076', NULL, 'SNB', 'OPERATIONS', true),
  ('Matthew', 'McDaniel', 'Matthew McDaniel', 'matthew.mcdaniel@sunbeltmodular.com', 'Project Manager', NULL, '4808484715', NULL, 'SNB', 'OPERATIONS', true),
  ('Hector', 'Vazquez', 'Hector Vazquez', 'hector.vazquez@sunbeltmodular.com', 'Project Manager', NULL, '2545004038', NULL, 'SNB', 'OPERATIONS', true),
  ('Lois', 'Plymale', 'Lois Plymale', 'lois.plymale@sunbeltmodular.com', 'Architect', '3527282930', '3527741679', NULL, 'SNB', 'DRAFTING', true),
  ('Michael', 'Grimes', 'Michael Grimes', 'michael.grimes@sunbeltmodular.com', 'Lead Drafter', NULL, '3529103963', NULL, 'SNB', 'DRAFTING', true),
  ('Shaylon', 'Vaughn', 'Shaylon Vaughn', 'shaylon.vaughn@sunbeltmodular.com', 'Director of Engineering', NULL, '6232023528', NULL, 'SNB', 'ENGINEERING', true),
  ('Jasmin', 'Vicente', 'Jasmin Vicente', 'jasmin.vicente@sunbeltmodular.com', 'Engineer', NULL, '4255011234', NULL, 'SNB', 'ENGINEERING', true),
  ('Valerie', 'Eskelsen', 'Valerie Eskelsen', 'valerie.eskelsen@sunbeltmodular.com', 'Engineer', NULL, NULL, NULL, 'SNB', 'ENGINEERING', true),
  ('Louis', 'Cribb', 'Louis Cribb', 'louis.cribb@sunbeltmodular.com', 'Engineer', NULL, '5749033610', NULL, 'SNB', 'ENGINEERING', true),
  ('Robert', 'Berry', 'Robert Berry', 'robert.berry@sunbeltmodular.com', 'Engineer', NULL, '6028267014', NULL, 'SNB', 'ENGINEERING', true),
  ('Roger', 'DeChavez', 'Roger DeChavez', 'roger.dechavez@sunbeltmodular.com', 'Engineer', NULL, '4806479242', NULL, 'SNB', 'ENGINEERING', true),
  ('Mark', 'Lindsay', 'Mark Lindsay', 'mark.lindsay@sunbeltmodular.com', 'Plan Examiner', NULL, '4804079519', NULL, 'SNB', 'DRAFTING', true),
  ('Michael', 'Schneider', 'Michael Schneider', 'michael.schneider@sunbeltmodular.com', 'Director of Drafting', '6024476460', '2144356267', '115', 'SNB', 'DRAFTING', true),
  ('Valerie', 'Edmond', 'Valerie Edmond', 'valerie.edmond@sunbeltmodular.com', 'Drafting Manager - Eastern Region', '6024476460', '4804275330', NULL, 'SNB', 'DRAFTING', true),
  ('Russ', 'Kory', 'Russ Kory', 'russ.kory@sunbeltmodular.com', 'Drafting Manager - West Region', '6024476460', '4808885037', '132', 'SNB', 'DRAFTING', true),
  ('Kyle', 'Nissen', 'Kyle Nissen', 'kyle.nissen@sunbeltmodular.com', 'Drafter', '6024476460', NULL, '131', 'SNB', 'DRAFTING', true),
  ('Rafael', 'Quiros', 'Rafael Quiros', 'rafael.quiros@sunbeltmodular.com', 'Drafter', '6024476460', NULL, '107', 'SNB', 'DRAFTING', true),
  ('Christopher', 'Burgos', 'Christopher Burgos', 'chris.burgos@sunbeltmodular.com', 'Drafter', '8174471213', NULL, '5807', 'SNB', 'DRAFTING', true),
  ('Lemon', 'Henry', 'Lemon Henry', 'lemon.henry@sunbeltmodular.com', 'Drafter', '6024476460', NULL, '133', 'SNB', 'DRAFTING', true),
  ('Marci', 'Mitchell', 'Marci Mitchell', 'marci.mitchell@sunbeltmodular.com', 'Director of Safety & Warranty', '6024476460', '6028030507', '101', 'SNB', 'SAFETY', true),
  ('Greg', 'Berry', 'Greg Berry', 'greg.berry@sunbeltmodular.com', 'Technical Support Manager', NULL, '8175577870', NULL, 'SNB', 'SERVICE', true),

  -- ========================================================================
  -- AMT - AMTEX (19 contacts)
  -- ========================================================================
  ('Noel', 'Lindsey', 'Noel Lindsey', 'noel.lindsey@amtexcorp.com', 'Plant General Manager', '9722767626', '2144500546', '107', 'AMT', 'OPERATIONS', true),
  ('Darian', 'Curry', 'Darian Curry', 'darian.curry@amtexcorp.com', 'Accounting Manager', '9722767626', '4697240141', '110', 'AMT', 'ACCOUNTING', true),
  ('Lucero', 'Martinez', 'Lucero Martinez', 'lucero.martinez@amtexcorp.com', 'Accounts Payable', '9722767626', NULL, '102', 'AMT', 'ACCOUNTING', true),
  ('Michelle', 'Ponce', 'Michelle Ponce', 'michelle.ponce@amtexcorp.com', 'Administrative Assistant', '9722767626', NULL, '100', 'AMT', 'OPERATIONS', true),
  ('Kelly', 'Kellie', 'Kelly Kellie', 'kelly.kellie@amtexcorp.com', 'Sales Manager', '9722767626', '4694169979', '103', 'AMT', 'SALES', true),
  ('Liz', 'Ramirez', 'Liz Ramirez', 'liz.ramirez@amtexcorp.com', 'Estimator', '9722767626', NULL, '105', 'AMT', 'SALES', true),
  ('Dyonatan', 'Cysz', 'Dyonatan Cysz', 'dyonatan.cysz@amtexcorp.com', 'Estimator', '9722767626', NULL, '112', 'AMT', 'SALES', true),
  ('Luis', 'Resendiz', 'Luis Resendiz', 'luis.resendiz@amtexcorp.com', 'Production Manager', '9722767626', '2147344582', '117', 'AMT', 'PRODUCTION', true),
  ('Humberto', 'Mendez', 'Humberto Mendez', 'humberto.mendez@amtexcorp.com', 'Production Supervisor', '9722767626', '2145519754', '109', 'AMT', 'PRODUCTION', true),
  ('Tommy', 'Garcia', 'Tommy Garcia', 'tommy.garcia@amtexcorp.com', 'Purchasing Manager', '9722767626', '4696905288', '115', 'AMT', 'PURCHASING', true),
  ('David', 'Flores', 'David Flores', 'david.flores@amtexcorp.com', 'Purchasing Assistant', '9722767626', '9727680062', '104', 'AMT', 'PURCHASING', true),
  ('Walter', 'Portillo', 'Walter Portillo', 'walter.portillo@amtexcorp.com', 'Material Control Supervisor', '9722767626', NULL, '104', 'AMT', 'PURCHASING', true),
  ('Alexander', 'Fontenarosa', 'Alexander Fontenarosa', 'alex.fontenarosa@amtexcorp.com', 'Project Coordinator', '9722767626', NULL, '113', 'AMT', 'OPERATIONS', true),
  ('Edward', 'Vrzalik', 'Edward Vrzalik', 'edward.vrzalik@amtexcorp.com', 'Drafting Manager', '9722767626', NULL, '108', 'AMT', 'DRAFTING', true),
  ('Rochelle', 'Da Costa', 'Rochelle Da Costa', 'rochelle.costa@amtexcorp.com', 'Drafter', '9722767626', NULL, '108', 'AMT', 'DRAFTING', true),
  ('Roy', 'Thompson', 'Roy Thompson', 'roy.thompson@amtexcorp.com', 'Quality Assurance Manager', '9722767626', '2145511936', '106', 'AMT', 'QUALITY', true),
  ('John', 'Mellet', 'John Mellet', 'john.mellett@amtexcorp.com', 'Safety Coordinator', '9722767626', '2149300127', NULL, 'AMT', 'SAFETY', true),
  ('Jose', 'Contreras', 'Jose Contreras', 'jose.contreras@amtexcorp.com', 'AMP Coordinator', '9722767626', '9729550371', NULL, 'AMT', 'PRODUCTION', true),
  ('Gabriel', 'Sanchez', 'Gabriel Sanchez', 'gabriel.sanchez@amtexcorp.com', 'Weld Shop Manager', NULL, '2145510964', NULL, 'AMT', 'PRODUCTION', true),

  -- ========================================================================
  -- BUSA - BRITCO USA (17 contacts)
  -- ========================================================================
  ('Jeremy', 'Jensen', 'Jeremy Jensen', 'jeremy.jensen@britcousa.com', 'Plant General Manager', '2547416701', '2546337766', NULL, 'BUSA', 'OPERATIONS', true),
  ('Steve', 'Hall', 'Steve Hall', 'steve.hall@britcousa.com', 'Accounting Manager', '2547416701', '2547445948', NULL, 'BUSA', 'ACCOUNTING', true),
  ('Marily', 'Hernandez', 'Marily Hernandez', 'marily.palacios@britcousa.com', 'Accounts Payable; HR/Payroll Specialist', '2547416701', '2544953492', NULL, 'BUSA', 'ACCOUNTING', true),
  ('Eduardo', 'Tabora', 'Eduardo Tabora', 'edward.tabora@britcousa.com', 'Estimating Manager/Sales', '2547416701', '8328762047', NULL, 'BUSA', 'SALES', true),
  ('Craven', 'Powers', 'Craven Powers', 'craven.powers@britcousa.com', 'Estimator', '2547416701', '2542319077', NULL, 'BUSA', 'SALES', true),
  ('William', 'Luna', 'William Luna', 'william.luna@britcousa.com', 'Estimator', '2547416701', '2548784708', NULL, 'BUSA', 'SALES', true),
  ('Ricardo', 'Montalvo', 'Ricardo Montalvo', 'ricardo.montalvo@britcousa.com', 'Production Manager', '2547416701', '2547221517', NULL, 'BUSA', 'PRODUCTION', true),
  ('Kimberly', 'Webb', 'Kimberly Webb', 'kimberly.webb@britcousa.com', 'Purchasing Manager', '2547416701', '8177063149', NULL, 'BUSA', 'PURCHASING', true),
  ('Heriberto', 'Montalvo', 'Heriberto Montalvo', 'eddie.montalvo@britcousa.com', 'Purchasing Assistant', '2547416701', '9366760718', NULL, 'BUSA', 'PURCHASING', true),
  ('Terry', 'Davis', 'Terry Davis', 'terry.davis@britcousa.com', 'Material Control/Receiving', '2547416701', '2547166020', NULL, 'BUSA', 'PURCHASING', true),
  ('Jaime', 'Moreno', 'Jaime Moreno', 'jaime.moreno@britcousa.com', 'Project Coordinator', '2547416701', '2542307441', NULL, 'BUSA', 'OPERATIONS', true),
  ('Scott', 'Rees', 'Scott Rees', 'scott.rees@britcousa.com', 'Engineering/Contracts Manager', '2547416701', '2543154073', NULL, 'BUSA', 'ENGINEERING', true),
  ('Mark', 'Jackson', 'Mark Jackson', 'mark.jackson@britcousa.com', 'Drafter', '2547416701', '2544472496', NULL, 'BUSA', 'DRAFTING', true),
  ('Javier', 'Rodriguez', 'Javier Rodriguez', 'javier.rodriguez@britcousa.com', 'Drafter', '2547416701', '9565637444', NULL, 'BUSA', 'DRAFTING', true),
  ('Angel', 'Diaz', 'Angel Diaz', 'angel.diaz@britcousa.com', 'Quality Control/Service Manager', '2547416701', '2543138350', NULL, 'BUSA', 'QUALITY', true),
  ('Juan', 'Ontiveros', 'Juan Ontiveros', 'juan.ontiveros@britcousa.com', 'Quality Control', '2547416701', '2543138359', NULL, 'BUSA', 'QUALITY', true),
  ('Patty', 'Mosley', 'Patty Mosley', 'patty.mosley@britcousa.com', 'Safety Coordinator', '2547416701', '9034676898', NULL, 'BUSA', 'SAFETY', true),

  -- ========================================================================
  -- C&B - C&B CUSTOM MODULAR (11 contacts)
  -- ========================================================================
  ('Chris', 'Chadwick', 'Chris Chadwick', 'chris.chadwick@candbmod.com', 'Plant General Manager', '5748487300', '5745964468', '127', 'C&B', 'OPERATIONS', true),
  ('Pam', 'Chadwick', 'Pam Chadwick', 'pam.chadwick@candbmod.com', 'Accounting Manager', '5748487300', '5745965505', '112', 'C&B', 'ACCOUNTING', true),
  ('Candace', 'Kafka', 'Candace Kafka', 'candace.kafka@candbmod.com', 'Human Resources/Safety', '5748487300', NULL, '124', 'C&B', 'HR', true),
  ('Lewis', 'Chadwick', 'Lewis Chadwick', 'lewis.chadwick@candbmod.com', 'Sales Manager', '5748487300', NULL, '106', 'C&B', 'SALES', true),
  ('Shannon', 'Robinson', 'Shannon Robinson', 'shannon.robinson@candbmod.com', 'Sales', '5748487300', NULL, '113', 'C&B', 'SALES', true),
  ('Shawn', 'Collins', 'Shawn Collins', 'shawn.collins@candbmod.com', 'Purchasing Manager', '5748487300', NULL, '128', 'C&B', 'PURCHASING', true),
  ('Dawn', 'Hout', 'Dawn Hout', 'dawn.hout@candbmod.com', 'Purchasing', '5748487300', NULL, '130', 'C&B', 'PURCHASING', true),
  ('Steve', 'Reynolds', 'Steve Reynolds', 'steve.reynolds@candbmod.com', 'Project Coordinator', '5748487300', NULL, '108', 'C&B', 'OPERATIONS', true),
  ('Becky', 'Bradbury', 'Becky Bradbury', 'becky.bradbury@candbmod.com', 'Drafting Manager', '5748487300', NULL, '104', 'C&B', 'DRAFTING', true),
  ('Guy', 'Vaughn', 'Guy Vaughn', 'guy.vaughn@candbmod.com', 'Drafter', '5748487300', NULL, '107', 'C&B', 'DRAFTING', true),
  ('Brandon', 'Kafka', 'Brandon Kafka', 'brandon.kafka@candbmod.com', 'Safety/QC/Dispatch', '5748487300', NULL, NULL, 'C&B', 'QUALITY', true),

  -- ========================================================================
  -- IBI - INDICOM BUILDINGS (22 contacts)
  -- ========================================================================
  ('Beth', 'Berry', 'Beth Berry', 'beth.berry@indicombuildings.com', 'Plant General Manager', '8174471213', '8179153844', '5814', 'IBI', 'OPERATIONS', true),
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
  ('Anne', 'Perez', 'Anne Perez', 'anne.perez@indicombuildings.com', 'Material Control', '8174471213', NULL, '5803', 'IBI', 'PURCHASING', true),
  ('Lisa', 'Linn', 'Lisa Linn', 'lisa.linn@indicombuildings.com', 'Project Coordinator', '8174471213', NULL, '5813', 'IBI', 'OPERATIONS', true),
  ('Matthew', 'Scott', 'Matthew Scott', 'matthew.scott@indicombuildings.com', 'Engineering Manager', '8174471213', '8177741206', '5831', 'IBI', 'ENGINEERING', true),
  ('David', 'Walker', 'David Walker', 'david.walker@indicombuildings.com', 'Architectural Designer', '8174471213', NULL, '5833', 'IBI', 'DRAFTING', true),
  ('Randy', 'Walker', 'Randy Walker', 'randy.walker@indicombuildings.com', 'Design Drafter', NULL, '6085723867', NULL, 'IBI', 'DRAFTING', true),
  ('Eliud', 'Saenz', 'Eliud Saenz', 'eliud.saenz@indicombuildings.com', 'Design Drafter', '8174471213', NULL, '5804', 'IBI', 'DRAFTING', true),
  ('Gabriel', 'Moreno', 'Gabriel Moreno', 'gabriel.moreno@indicombuildings.com', 'Design Drafter', '8174471213', NULL, '5832', 'IBI', 'DRAFTING', true),
  ('Erik', 'Fabela', 'Erik Fabela', 'erik.fabela@indicombuildings.com', 'Warranty/QC Manager', '8174471213', '8176917954', '5841', 'IBI', 'QUALITY', true),
  ('Nataly', 'Chaidez', 'Nataly Chaidez', 'nataly.chaidez@indicombuildings.com', 'Safety Coordinator', '8174471213', NULL, '5808', 'IBI', 'SAFETY', true),
  ('Jay', 'Stratton', 'Jay Stratton', 'jay.stratton@indicombuildings.com', 'QC/Transportation Supervisor', '8174471213', NULL, '5822', 'IBI', 'SERVICE', true),
  ('Marvin', 'McGahan', 'Marvin McGahan', 'marvin.mcgahan@indicombuildings.com', 'Warranty Service', NULL, '6823185599', NULL, 'IBI', 'SERVICE', true),

  -- ========================================================================
  -- MRS - MR STEEL (10 contacts)
  -- ========================================================================
  ('Dan', 'King', 'Dan King', 'dan.king@mrsteel.com', 'Plant General Manager', '6022783355', '6023274772', '105', 'MRS', 'OPERATIONS', true),
  ('Nick', 'Tran', 'Nick Tran', 'nick.tran@mrsteel.com', 'Accounting Manager', '6022783355', '6027620501', '111', 'MRS', 'ACCOUNTING', true),
  ('Dawn', 'Vollmer', 'Dawn Vollmer', 'dawn.vollmer@mrsteel.com', 'Administrative Assistant', '6022783355', NULL, '100', 'MRS', 'OPERATIONS', true),
  ('Juan', 'Figueroa', 'Juan Figueroa', 'juan.figueroa@mrsteel.com', 'Sales Manager', '6022783355', '6026773964', '101', 'MRS', 'SALES', true),
  ('Dylan', 'King', 'Dylan King', 'dylan.king@mrsteel.com', 'Sales Coordinator', '6022783355', '6022910665', '112', 'MRS', 'SALES', true),
  ('Gary', 'Allen', 'Gary Allen', 'gary.allen@mrsteel.com', 'Production Manager', '6022783355', '6022145983', '107', 'MRS', 'PRODUCTION', true),
  ('Tim', 'Woods', 'Tim Woods', 'tim.woods@mrsteel.com', 'Foreman', '6022783355', '6027624629', '106', 'MRS', 'PRODUCTION', true),
  ('LaQuana', 'Allen', 'LaQuana Allen', 'laquana.yazzie@mrsteel.com', 'Purchasing Assistant', '6022783355', '9289205564', '114', 'MRS', 'PURCHASING', true),
  ('Willie', 'Shackleford', 'Willie Shackleford', 'willie.shackleford@mrsteel.com', 'Estimating/Purchasing/Machine Shop Manager', '6022783355', '6023705921', '103', 'MRS', 'SALES', true),
  ('Robert', 'Elizondo', 'Robert Elizondo', 'robert.elizondo@mrsteel.com', 'Safety Coordinator', '6022783355', NULL, '110', 'MRS', 'SAFETY', true),

  -- ========================================================================
  -- NWBS - NORTHWEST BUILDING SYSTEMS (20 contacts)
  -- ========================================================================
  ('Ross', 'Parks', 'Ross Parks', 'ross.parks@nwbsinc.com', 'Plant General Manager', '2083443527', '2088663615', NULL, 'NWBS', 'OPERATIONS', true),
  ('Jenn', 'Parks', 'Jenn Parks', 'jenn.parks@nwbsinc.com', 'Accounting Manager', '2083443527', '2088602719', NULL, 'NWBS', 'ACCOUNTING', true),
  ('Alondra', 'Vargas', 'Alondra Vargas', 'alondra.vargas@nwbsinc.com', 'HR/Payroll Specialist', '2083443527', NULL, NULL, 'NWBS', 'HR', true),
  ('Jennifer', 'Lonergan', 'Jennifer Lonergan', 'jennifer.lonergan@nwbsinc.com', 'Office Admin/AP', '2083443527', NULL, '0', 'NWBS', 'OPERATIONS', true),
  ('Mitch', 'Quintana', 'Mitch Quintana', 'mitch.quintana@nwbsinc.com', 'Sales Manager', '2083443527', '2088602582', NULL, 'NWBS', 'SALES', true),
  ('Robert', 'Thaler', 'Robert Thaler', 'robert.thaler@nwbsinc.com', 'Estimator', '2083443527', '2088602763', NULL, 'NWBS', 'SALES', true),
  ('Justin', 'Downing', 'Justin Downing', 'justin.downing@nwbsinc.com', 'Production Manager', '2083443527', '2087139828', '9', 'NWBS', 'PRODUCTION', true),
  ('Steve', 'Cummings', 'Steve Cummings', 'steve.cummings@nwbsinc.com', 'Plant Manager 1', '2083443527', NULL, NULL, 'NWBS', 'OPERATIONS', true),
  ('Ronnie', 'Ludquist', 'Ronnie Ludquist', 'ronald.lundquist@nwbsinc.com', 'Plant Manager 2', '2083443527', NULL, NULL, 'NWBS', 'OPERATIONS', true),
  ('Russ', 'Metzger', 'Russ Metzger', 'russ.metzger@nwbsinc.com', 'Purchasing Manager', '2083443527', '2088674781', '1', 'NWBS', 'PURCHASING', true),
  ('Justin', 'Weast', 'Justin Weast', 'justin.weast@nwbsinc.com', 'Purchasing Assistant', '2083443527', '2086059974', '7', 'NWBS', 'PURCHASING', true),
  ('Cassey', 'Brandon', 'Cassey Brandon', 'cassey.brandon@nwbsinc.com', 'Material Control', '2083443527', '2085765325', NULL, 'NWBS', 'PURCHASING', true),
  ('Kelly', 'Daniels', 'Kelly Daniels', 'kelly.daniels@nwbsinc.com', 'Drafter', '2083443527', '2084841662', NULL, 'NWBS', 'DRAFTING', true),
  ('James', 'McLeod', 'James McLeod', 'james.mcleod@nwbsinc.com', 'Drafter', '2083443527', NULL, NULL, 'NWBS', 'DRAFTING', true),
  ('Trent', 'Thomson', 'Trent Thomson', 'trent.thomson@nwbsinc.com', 'Quality Assurance Manager', '2083443527', '2084051197', NULL, 'NWBS', 'QUALITY', true),
  ('Jeff', 'Murray', 'Jeff Murray', 'jeff.murray@nwbsinc.com', 'Safety Coordinator', '2083443527', '2085737322', NULL, 'NWBS', 'SAFETY', true),
  ('Steve', 'Jackman', 'Steve Jackman', 'steven.jackman@nwbsinc.com', 'QC/Transport Supervisor', '2083443527', NULL, NULL, 'NWBS', 'SERVICE', true),
  ('Sepp', 'Braun', 'Sepp Braun', 'sepp.braun@nwbsinc.com', 'Service Technician', '2083443527', '2089688710', '8', 'NWBS', 'SERVICE', true),
  ('Jerad', 'Martindale', 'Jerad Martindale', 'jerad.martindale@nwbsinc.com', 'Maintenance', '2083443527', '2088413865', NULL, 'NWBS', 'SERVICE', true),

  -- ========================================================================
  -- PMI - PHOENIX MODULAR (22 contacts)
  -- ========================================================================
  ('Monty', 'King', 'Monty King', 'monty.king@phoenixmodular.com', 'Plant General Manager', '6024476460', '6023274771', '116', 'PMI', 'OPERATIONS', true),
  ('Amber', 'Chase', 'Amber Chase', 'amber.chase@phoenixmodular.com', 'Plant Accounting Manager', '6024476460', '6053765322', '306', 'PMI', 'ACCOUNTING', true),
  ('Susie', 'Ayala', 'Susie Ayala', 'susie.ayala@phoenixmodular.com', 'HR/Payroll Specialist', '6024476460', NULL, '120', 'PMI', 'HR', true),
  ('Melanie', 'Kenyon', 'Melanie Kenyon', 'melanie.kenyon@phoenixmodular.com', 'A/P Specialist', '6024476460', NULL, '128', 'PMI', 'ACCOUNTING', true),
  ('Sonia', 'Quezada', 'Sonia Quezada', 'sonia.quezada@phoenixmodular.com', 'Administrative Assistant', '6024476460', NULL, '100', 'PMI', 'OPERATIONS', true),
  ('Brian', 'Shackleford', 'Brian Shackleford', 'brian.shackleford@phoenixmodular.com', 'Sales Manager', '6024476460', '6023975474', '105', 'PMI', 'SALES', true),
  ('Angela', 'Perillo', 'Angela Perillo', 'angela.perillo@phoenixmodular.com', 'Sales & Estimating', '6024476460', NULL, '127', 'PMI', 'SALES', true),
  ('Chris', 'Thomas', 'Chris Thomas', 'chris.thomas@sunbeltmodular.com', 'Sales & Estimating', '6024476460', NULL, '136', 'PMI', 'SALES', true),
  ('Dominic', 'Delucia', 'Dominic Delucia', 'dominic.delucia@phoenixmodular.com', 'Sales & Estimating', '6024476460', NULL, NULL, 'PMI', 'SALES', true),
  ('Rafael', 'Quiros', 'Rafael Quiros', 'rafael.quiros@phoenixmodular.com', 'Production Manager', '6024476460', '6023206044', '135', 'PMI', 'PRODUCTION', true),
  ('Sam', 'Murillo', 'Sam Murillo', 'sam.murillo@phoenixmodular.com', 'Purchasing Manager', '6024476460', '6028030066', '113', 'PMI', 'PURCHASING', true),
  ('Mariana', 'Martinez', 'Mariana Martinez', 'mariana.martinez@phoenixmodular.com', 'Purchasing Assistant', '6024476460', NULL, '126', 'PMI', 'PURCHASING', true),
  ('Ramon', 'Armenta', 'Ramon Armenta', 'ramon.armenta@phoenixmodular.com', 'Purchasing Assistant', '6024476460', NULL, '137', 'PMI', 'PURCHASING', true),
  ('Dawn', 'Lesser', 'Dawn Lesser', 'dawn.lesser@phoenixmodular.com', 'Material Control Foreman', '6024476460', '6026002544', '118', 'PMI', 'PRODUCTION', true),
  ('Jessica', 'Flores', 'Jessica Flores', 'jessica.flores@phoenixmodular.com', 'Receiving Data Entry Clerk', '6024476460', NULL, '110', 'PMI', 'PURCHASING', true),
  ('Juanita', 'Earnest', 'Juanita Earnest', 'juanita.earnest@phoenixmodular.com', 'Project Coordinator Supervisor', '6024476460', NULL, '121', 'PMI', 'OPERATIONS', true),
  ('Rodrigo', 'Mejia', 'Rodrigo Mejia', 'rodrigo.mejia@phoenixmodular.com', 'Drafting Manager', '6024476460', NULL, '107', 'PMI', 'DRAFTING', true),
  ('Cody', 'King', 'Cody King', 'cody.king@phoenixmodular.com', 'Drafter', '6024476460', NULL, '125', 'PMI', 'DRAFTING', true),
  ('Cristobal', 'Lizarraga', 'Cristobal Lizarraga', 'cristobal.lizarraga@phoenixmodular.com', 'Drafter', '6024476460', NULL, '125', 'PMI', 'DRAFTING', true),
  ('Shawn', 'Stroh', 'Shawn Stroh', 'shawn.stroh@phoenixmodular.com', '(Interim) Quality Assurance Manager', '6024476460', '6023305439', '123', 'PMI', 'QUALITY', true),
  ('Alex', 'Alvarado Moreno', 'Alex Alvarado Moreno', 'alexis.alvarado@phoenixmodular.com', 'QC/Transport Supervisor', '6024476460', '4807208795', '109', 'PMI', 'SERVICE', true),
  ('Donald', 'Hull', 'Donald Hull', 'don.hull@phoenixmodular.com', 'Safety Coordinator', '6024476460', NULL, '130', 'PMI', 'SAFETY', true),

  -- ========================================================================
  -- PRM - PROMOD MANUFACTURING (24 contacts)
  -- ========================================================================
  ('CJ', 'Yarbrough', 'CJ Yarbrough', 'cj.yarbrough@promodmfg.com', 'Plant General Manager', '2299375401', '2299423495', '104', 'PRM', 'OPERATIONS', true),
  ('Tina', 'Powell', 'Tina Powell', 'tina.powell@promodmfg.com', 'Accounting Manager', '2299375401', '2295758738', '126', 'PRM', 'ACCOUNTING', true),
  ('Lisa', 'James', 'Lisa James', 'lisa.james@promodmfg.com', 'A/P/Receptionist', '2299375401', '2299380023', '100', 'PRM', 'ACCOUNTING', true),
  ('Denise', 'Brown', 'Denise Brown', 'denise.brown@promodmfg.com', 'HR/Payroll', '2299375401', '2295918818', '118', 'PRM', 'HR', true),
  ('Dean', 'Long', 'Dean Long', 'dean.long@promodmfg.com', 'Sales Manager', '2299375401', '2293149326', '106', 'PRM', 'SALES', true),
  ('Carmetrick', 'Ross', 'Carmetrick Ross', 'carmetrick.ross@promodmfg.com', 'Sales & Estimation', '2299375401', '2299429688', '103', 'PRM', 'SALES', true),
  ('Josh', 'Mattson', 'Josh Mattson', 'josh.mattson@promodmfg.com', 'Sales & Estimation', '2299375401', '2295758747', '114', 'PRM', 'SALES', true),
  ('Jarrett', 'Long', 'Jarrett Long', 'jarrett.long@promodmfg.com', 'Sales & Estimation', '2299375401', '2299382119', NULL, 'PRM', 'SALES', true),
  ('Donald', 'Berry', 'Donald Berry', 'duane.berry@promodmfg.com', 'Production Manager (ProMod)', '2299375401', '2299421482', '109', 'PRM', 'PRODUCTION', true),
  ('Justin', 'Renfroe', 'Justin Renfroe', 'justin.renfroe@promodmfg.com', 'Production Manager (ProBox)', '2299375401', '2299424469', '116', 'PRM', 'PRODUCTION', true),
  ('Michael', 'Hernandez', 'Michael Hernandez', 'michael.hernandez@promodmfg.com', 'Purchasing Manager', '2299375401', '2293145290', '120', 'PRM', 'PURCHASING', true),
  ('Rufus', 'Yarbrough', 'Rufus Yarbrough', 'rufus.yarbrough@promodmfg.com', 'Purchasing Agent', '2299375401', '2293141542', '122', 'PRM', 'PURCHASING', true),
  ('Brooke', 'Albritton', 'Brooke Albritton', 'brooke.albritton@promodmfg.com', 'Material Control', '2299375401', '2298152929', NULL, 'PRM', 'PURCHASING', true),
  ('Toby', 'Sexton', 'Toby Sexton', 'toby.sexton@promodmfg.com', 'Project Coordinator', '2299375401', '4782833581', '110', 'PRM', 'OPERATIONS', true),
  ('Matthew', 'Murphy', 'Matthew Murphy', 'matt.murphy@promodmfg.com', 'Drafting Manager', '2299375401', '2293141837', '117', 'PRM', 'DRAFTING', true),
  ('Jackson', 'Benjamin', 'Jackson Benjamin', 'jackson.benjamin@promodmfg.com', 'Drafter', '2299375401', '2299428353', '112', 'PRM', 'DRAFTING', true),
  ('Marvin', 'Horne', 'Marvin Horne', 'marvin.horne@promodmfg.com', 'Drafter', '2299375401', '2293149975', '131', 'PRM', 'DRAFTING', true),
  ('Pete', 'Yarbrough', 'Pete Yarbrough', 'pete.yarbrough@promodmfg.com', 'Service Manager', '2299375401', '3522675431', '119', 'PRM', 'SERVICE', true),
  ('Steve', 'Cleghorn', 'Steve Cleghorn', 'steve.cleghorn@promodmfg.com', 'Quality Control', '2299375401', '2055226757', '102', 'PRM', 'QUALITY', true),
  ('Matthew', 'Burns', 'Matthew Burns', 'matt.burns@promodmfg.com', 'Quality Control', '2299375401', '2299384202', '123', 'PRM', 'QUALITY', true),
  ('Tyler', 'Lynn', 'Tyler Lynn', 'tyler.lynn@promodmfg.com', 'Quality Control', '2299375401', '2293141961', '130', 'PRM', 'QUALITY', true),
  ('Earl', 'Godwin', 'Earl Godwin', 'earl.godwin@promodmfg.com', 'Quality Control', '2299375401', '2299423665', NULL, 'PRM', 'QUALITY', true),
  ('Donnie', 'Dew', 'Donnie Dew', 'donnie.dew@promodmfg.com', 'Quality Control (ProBox)', '2299375401', '2299382524', '128', 'PRM', 'QUALITY', true),
  ('Chris', 'Schwarzer', 'Chris Schwarzer', 'chris.schwarzer@promodmfg.com', 'Safety', '2299375401', '2295914330', '124', 'PRM', 'SAFETY', true),

  -- ========================================================================
  -- SMM - SOUTHEAST MODULAR MANUFACTURING (17 contacts)
  -- ========================================================================
  ('Joe', 'Reid', 'Joe Reid', 'joe.reid@southeastmodular.com', 'Plant General Manager', '3527282930', '2143368582', '301', 'SMM', 'OPERATIONS', true),
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
  ('Dave', 'McEwen', 'Dave McEwen', 'dave.mcewen@southeastmodular.com', 'Material Control', '3527282930', '3526032011', '315', 'SMM', 'PURCHASING', true),
  ('Katie', 'Myers', 'Katie Myers', 'katie.myers@southeastmodular.com', 'Project Coordinator', '3527282930', '3526263577', '312', 'SMM', 'OPERATIONS', true),
  ('Chris', 'Smith', 'Chris Smith', 'chris.smith@southeastmodular.com', 'Drafting Manager', '3527282930', NULL, '307', 'SMM', 'DRAFTING', true),
  ('Otha', 'Matthews', 'Otha Matthews', 'tommy.matthews@southeastmodular.com', 'Drafter', '3527282930', NULL, '307', 'SMM', 'DRAFTING', true),
  ('Zachary', 'Esguerra', 'Zachary Esguerra', 'zachary.esguerra@southeastmodular.com', 'Drafter', '3527282930', NULL, '307', 'SMM', 'DRAFTING', true),
  ('Daniel', 'Lemusmora', 'Daniel Lemusmora', 'daniel.lemusmora@southeastmodular.com', 'Quality Assurance Manager', '3527282930', '3529103963', '302', 'SMM', 'QUALITY', true),

  -- ========================================================================
  -- SSI - SPECIALIZED STRUCTURES (17 contacts)
  -- ========================================================================
  ('Glenn', 'Gardner', 'Glenn Gardner', 'glenn.gardner@specializedstructures.com', 'Plant General Manager', '9125346111', '9125346111', NULL, 'SSI', 'OPERATIONS', true),
  ('Peggy', 'Forest', 'Peggy Forest', 'peggy.forest@specializedstructures.com', 'Accounting Manager', '9125346111', '9123100878', NULL, 'SSI', 'ACCOUNTING', true),
  ('Vaneza', 'Aguilar', 'Vaneza Aguilar', 'vaneza.aguilar@specializedstructures.com', 'Accounts Payable', '9125346111', NULL, NULL, 'SSI', 'ACCOUNTING', true),
  ('Fatima', 'Corona', 'Fatima Corona', 'fatima.corona@specializedstructures.com', 'HR/Payroll Specialist', '9125346111', NULL, NULL, 'SSI', 'HR', true),
  ('Josh', 'Ellis', 'Josh Ellis', 'josh.ellis@specializedstructures.com', 'Sales Manager', '9125346111', '9123270256', NULL, 'SSI', 'SALES', true),
  ('Derek', 'Little', 'Derek Little', 'derek.little@specializedstructures.com', 'Estimator', '9125346111', '9123098056', NULL, 'SSI', 'SALES', true),
  ('Josh', 'Polk', 'Josh Polk', 'josh.polk@specializedstructures.com', 'Estimator', '9125346111', '9125923882', NULL, 'SSI', 'SALES', true),
  ('Grant', 'Gardner', 'Grant Gardner', 'grant.gardner@specializedstructures.com', 'Production Manager', '9125346111', '9123099603', NULL, 'SSI', 'PRODUCTION', true),
  ('Charlie', 'Bennett', 'Charlie Bennett', 'charlie.bennett@specializedstructures.com', 'Purchasing Manager', '9125346111', '9123812063', NULL, 'SSI', 'PURCHASING', true),
  ('Kenneth', 'Haskins', 'Kenneth Haskins', 'kenneth.haskins@specializedstructures.com', 'Purchasing Assistant', '9125346111', NULL, NULL, 'SSI', 'PURCHASING', true),
  ('William', 'Peacock', 'William Peacock', 'william.peacock@specializedstructures.com', 'Material Control', '9125346111', NULL, NULL, 'SSI', 'PURCHASING', true),
  ('Silvanna', 'Corona', 'Silvanna Corona', 'silvanna.corona@specializedstructures.com', 'Project Coordinator', '9125346111', NULL, NULL, 'SSI', 'OPERATIONS', true),
  ('Tyler', 'Ellis', 'Tyler Ellis', 'tyler.ellis@specializedstructures.com', 'Drafter', '9125346111', NULL, NULL, 'SSI', 'DRAFTING', true),
  ('Gavin', 'Grantham', 'Gavin Grantham', 'gavin.grantham@specializedstructures.com', 'Drafter', '9125346111', NULL, NULL, 'SSI', 'DRAFTING', true),
  ('Kevin', 'Gillespie', 'Kevin Gillespie', 'kevin.gillespie@specializedstructures.com', 'Service Manager', '9125346111', NULL, NULL, 'SSI', 'SERVICE', true),
  ('Dudley', 'Vickers', 'Dudley Vickers', 'dudley.vickers@specializedstructures.com', 'Quality Control', NULL, NULL, NULL, 'SSI', 'QUALITY', true),
  ('Jim', 'Harrell', 'Jim Harrell', 'jim.harrell@specializedstructures.com', 'Quality Control', '9125346111', NULL, NULL, 'SSI', 'QUALITY', true),

  -- ========================================================================
  -- WM-EAST - WHITLEY MANUFACTURING EAST (18 contacts)
  -- ========================================================================
  ('Joe', 'Dattoli', 'Joe Dattoli', 'joedattoli@whitleyman.com', 'Plant General Manager', '7176562081', '7178261711', '470', 'WM-EAST', 'OPERATIONS', true),
  ('Don', 'Engle', 'Don Engle', 'donengle@whitleyman.com', '(assisting new GM)', '7176562081', '7175875252', NULL, 'WM-EAST', 'OPERATIONS', true),
  ('Tracy', 'Lagaza', 'Tracy Lagaza', 'tracylagaza@whitleyman.com', 'Office Manager, QA Admin.', '7176562081', '7176698422', '400', 'WM-EAST', 'QUALITY', true),
  ('Kristin', 'Garber', 'Kristin Garber', 'kristingarber@whitleyman.com', 'HR', '7176562081', '6106794548', '430', 'WM-EAST', 'HR', true),
  ('Christine', 'Kline', 'Christine Kline', 'christinekline@whitleyman.com', 'Sales/Estimating', '7176562081', '6102230507', '450', 'WM-EAST', 'SALES', true),
  ('Steve', 'Adams', 'Steve Adams', 'eastsupv@whitleyman.com', 'Supervisor (plant 1)', '7176562081', '7176066753', '481', 'WM-EAST', 'PRODUCTION', true),
  ('Mike', 'Greiner', 'Mike Greiner', 'eastsupv@whitleyman.com', 'Supervisor (plant 1)', '7176562081', '7174725150', '481', 'WM-EAST', 'PRODUCTION', true),
  ('Sammy', 'Reyes-Ramos', 'Sammy Reyes-Ramos', 'sammyramos@whitleyman.com', 'Supervisor (plant 2)', '7176562081', '7178261528', '487', 'WM-EAST', 'PRODUCTION', true),
  ('Ethan', 'Paul', 'Ethan Paul', 'ethanpaul@whitleyman.com', 'Engineering/Design/IT', '7176562081', '5704155358', '440', 'WM-EAST', 'ENGINEERING', true),
  ('Blaine', 'Brillhart', 'Blaine Brillhart', 'blainebrillhart@whitleyman.com', 'Drafter', '7176562081', '7178049100', '441', 'WM-EAST', 'DRAFTING', true),
  ('JC', 'Redmond', 'JC Redmond', 'jcredmond@whitleyman.com', 'Project Manager', '7176562081', '7178753732', '460', 'WM-EAST', 'OPERATIONS', true),
  ('Craig', 'Smith', 'Craig Smith', 'craigsmith@whitleyman.com', 'Purchaser Manager', '7176562081', '7175724596', '421', 'WM-EAST', 'PURCHASING', true),
  ('Robert', 'Frankfort', 'Robert Frankfort', 'robertfrankfort@whitleyman.com', 'Purchaser', '7176562081', '2237970202', '420', 'WM-EAST', 'PURCHASING', true),
  ('Bill', 'Stover', 'Bill Stover', 'eastreceiving@whitleyman.com', 'Receiving Manager', '7176562081', '7172091795', '422', 'WM-EAST', 'PURCHASING', true),
  ('Randy', 'Gibson', 'Randy Gibson', 'eastmaintenance@whitleyman.com', 'Maintenance Manager', '7176562081', '7179470316', '482', 'WM-EAST', 'SERVICE', true),
  ('Kevin', 'Stauffer', 'Kevin Stauffer', 'eastqa2@whitleyman.com', 'QA Manager', '7176562081', '6105852881', '412', 'WM-EAST', 'QUALITY', true),
  ('Dylan', 'Loper', 'Dylan Loper', 'dylanloper@whitleyman.com', 'Operations Manager', '7176562081', '7178812728', '410', 'WM-EAST', 'OPERATIONS', true),
  ('Jose', 'Nogueras', 'Jose Nogueras', 'josenogueras@whitleyman.com', 'Operations Manager', '7176562081', '7173277785', '480', 'WM-EAST', 'OPERATIONS', true),

  -- ========================================================================
  -- WM-EVERGREEN - WHITLEY MANUFACTURING EVERGREEN (10 contacts)
  -- ========================================================================
  ('Randy', 'Maddox', 'Randy Maddox', 'randymaddox@whitleyman.com', 'Plant General Manager', '3606535790', NULL, '23', 'WM-EVERGREEN', 'OPERATIONS', true),
  ('Kali', 'Partridge', 'Kali Partridge', 'kalipartridge@whitleyman.com', 'HR/Admin', '3606535790', NULL, '10', 'WM-EVERGREEN', 'HR', true),
  ('Hank', 'Kennedy', 'Hank Kennedy', 'hankkennedy@whitleyman.com', 'Estimating', '3606535790', NULL, '18', 'WM-EVERGREEN', 'SALES', true),
  ('Clint', 'Williams', 'Clint Williams', 'clintwilliams@whitleyman.com', 'Production Manager', '3606535790', NULL, '26', 'WM-EVERGREEN', 'PRODUCTION', true),
  ('Walt', 'Hylback', 'Walt Hylback', 'walthylback@whitleyman.com', 'Purchasing Manager', '3606535790', NULL, '24', 'WM-EVERGREEN', 'PURCHASING', true),
  ('Alysha', 'Lantz', 'Alysha Lantz', 'alyshalantz@whitleyman.com', 'Accts Receivable/Purchasing', '3606535790', NULL, '21', 'WM-EVERGREEN', 'PURCHASING', true),
  ('Mike', 'Perry', 'Mike Perry', 'mikeperry@whitleyman.com', 'Design Manager', '3606535790', NULL, '22', 'WM-EVERGREEN', 'DRAFTING', true),
  ('Tina', 'Bach', 'Tina Bach', 'tinabach@whitleyman.com', 'Drafting Assistant', '3606535790', NULL, '14', 'WM-EVERGREEN', 'DRAFTING', true),
  ('Nicole', 'Gruendl', 'Nicole Gruendl', 'nicolegruendl@whitleyman.com', 'Assistant Project Manager', '3606535790', NULL, '19', 'WM-EVERGREEN', 'OPERATIONS', true),
  ('Mike', 'Soley', 'Mike Soley', 'mikesoley@whitleyman.com', 'QA/QC Manager', '3606535790', NULL, '26', 'WM-EVERGREEN', 'QUALITY', true),

  -- ========================================================================
  -- WM-SOUTH - WHITLEY MANUFACTURING SOUTH WHITLEY (26 contacts)
  -- ========================================================================
  ('Simon', 'Dragan', 'Simon Dragan', 'simondragan@whitleyman.com', 'CEO', '2607235131', '2604500264', '218', 'WM-SOUTH', 'EXECUTIVE', true),
  ('Drew', 'Welborn', 'Drew Welborn', 'drewwelborn@whitleyman.com', 'President', '2607235131', '2604505904', '204', 'WM-SOUTH', 'EXECUTIVE', true),
  ('Jeff', 'Zukowski', 'Jeff Zukowski', 'jeffzukowski@whitleyman.com', 'Continuous Improvement', '2607235131', '3314449513', '221', 'WM-SOUTH', 'OPERATIONS', true),
  ('Bob', 'Jones', 'Bob Jones', 'bobjones@whitleyman.com', 'VP Finance', '2607235131', '2607502948', '219', 'WM-SOUTH', 'EXECUTIVE', true),
  ('Laurie', 'England', 'Laurie England', 'laurieengland@whitleyman.com', 'HR/Payroll', '2607235131', '2603778292', '203', 'WM-SOUTH', 'HR', true),
  ('Stacey', 'Blain', 'Stacey Blain', 'staceyblain@whitleyman.com', 'Accounts Payable', '2607235131', '2602139910', '208', 'WM-SOUTH', 'ACCOUNTING', true),
  ('Anne', 'Scarano', 'Anne Scarano', 'annescarano@whitleyman.com', 'Receptionist/Accounts Payable', '2607235131', '2177798956', '200', 'WM-SOUTH', 'ACCOUNTING', true),
  ('William', 'Mann', 'William Mann', 'willmann@whitleyman.com', 'VP Vertical Marketing', '2607235131', '7047190509', NULL, 'WM-SOUTH', 'EXECUTIVE', true),
  ('Dan', 'Lipinski', 'Dan Lipinski', 'danlipinski@whitleyman.com', 'Estimator', '2607235131', '2604099614', '212', 'WM-SOUTH', 'SALES', true),
  ('Larry', 'High', 'Larry High', 'larryhigh@whitleyman.com', 'Estimator', '2607235131', '2606020504', '213', 'WM-SOUTH', 'SALES', true),
  ('Garett', 'Simmons', 'Garett Simmons', 'garettsimmons@whitleyman.com', 'Estimator Project Mgr', '2607235131', '2602296131', '228', 'WM-SOUTH', 'SALES', true),
  ('Dan', 'Schuhler', 'Dan Schuhler', 'danschuhler@whitleyman.com', 'Project Mgr/Estimator', '2607235131', '2604138950', '283', 'WM-SOUTH', 'SALES', true),
  ('Don', 'Harlan', 'Don Harlan', 'donharlan@whitleyman.com', 'Plant Manager', '2607235131', '5745270371', '222', 'WM-SOUTH', 'OPERATIONS', true),
  ('Kevin', 'Henning', 'Kevin Henning', 'kevinhenning@whitleyman.com', 'Supervisor A & B', '2607235131', '2603121171', '262', 'WM-SOUTH', 'PRODUCTION', true),
  ('Bryce', 'Bender', 'Bryce Bender', 'brycebender@whitleyman.com', 'Supervisor C', '2607235131', '2605306728', '230', 'WM-SOUTH', 'PRODUCTION', true),
  ('Gage', 'Benson', 'Gage Benson', 'gagebenson@whitleyman.com', 'Purchasing', '2607235131', '2604095471', '209', 'WM-SOUTH', 'PURCHASING', true),
  ('Tim', 'Kelsey', 'Tim Kelsey', 'timkelsey@whitleyman.com', 'Purchasing', '2607235131', '5749306150', '202', 'WM-SOUTH', 'PURCHASING', true),
  ('Elena', 'Harris', 'Elena Harris', 'elenaharris@whitleyman.com', 'QC/Purchasing', '2607235131', '2604183262', '227', 'WM-SOUTH', 'QUALITY', true),
  ('Adam', 'Parker', 'Adam Parker', 'adamparker@whitleyman.com', 'Drafting', '2607235131', '2605031481', '229', 'WM-SOUTH', 'DRAFTING', true),
  ('Richard', 'Harlan', 'Richard Harlan', 'richardharlan@whitleyman.com', 'Drafting', '2607235131', '2605683214', '225', 'WM-SOUTH', 'DRAFTING', true),
  ('Anthony', 'Hedglen', 'Anthony Hedglen', 'anthonyhedglen@whitleyman.com', 'Drafting', '2607235131', '5743509096', '281', 'WM-SOUTH', 'DRAFTING', true),
  ('Rebecca', 'Martin', 'Rebecca Martin', 'rebeccamartin@whitleyman.com', 'Drafting', '2607235131', '2602736132', '282', 'WM-SOUTH', 'DRAFTING', true),
  ('Kalah', 'Siler', 'Kalah Siler', 'kalahsiler@whitleyman.com', 'Drafting', '2607235131', '3607088667', '224', 'WM-SOUTH', 'DRAFTING', true),
  ('Taylor', 'Tullis', 'Taylor Tullis', 'taylortullis@whitleyman.com', 'Drafting', '2607235131', '5132930541', NULL, 'WM-SOUTH', 'DRAFTING', true),
  ('Crystal', 'Lee', 'Crystal Lee', 'crystallee@whitleyman.com', 'Systems Coordinator', '2607235131', '5184198276', '210', 'WM-SOUTH', 'IT', true),
  ('Joshua', 'Rhodes', 'Joshua Rhodes', 'joshuarhodes@whitleyman.com', 'QC', '2607235131', '5742489602', NULL, 'WM-SOUTH', 'QUALITY', true),

  -- ========================================================================
  -- WM-ROCHESTER - WHITLEY MANUFACTURING ROCHESTER (11 contacts)
  -- ========================================================================
  ('Kole', 'Kroft', 'Kole Kroft', 'kolekroft@whitleyman.com', 'Plant General Manager', '5742234934', '2198633733', '109', 'WM-ROCHESTER', 'OPERATIONS', true),
  ('Kerry', 'Nelson', 'Kerry Nelson', 'kerrynelson@whitleyman.com', 'HR/Recruiting', '5742234934', '5748350602', '106', 'WM-ROCHESTER', 'HR', true),
  ('Beth', 'Balser', 'Beth Balser', 'bethbalser@whitleyman.com', 'Receptionist/Admin.Asst.', '5742234934', '5748471352', '101', 'WM-ROCHESTER', 'OPERATIONS', true),
  ('Rob', 'Farris', 'Rob Farris', 'robfarris@whitleyman.com', 'Production Manager P1', '5742234934', '5742018691', '108', 'WM-ROCHESTER', 'PRODUCTION', true),
  ('Jose', 'Jimenez', 'Jose Jimenez', 'josejimenez@whitleyman.com', 'Production Manager P2', '5742234934', '6309150858', '111', 'WM-ROCHESTER', 'PRODUCTION', true),
  ('Linda', 'Martin', 'Linda Martin', 'lindamartin@whitleyman.com', 'Purchasing Manager', '5742234934', '5747212592', '128', 'WM-ROCHESTER', 'PURCHASING', true),
  ('Ruth', 'Music', 'Ruth Music', 'ruthmusic@whitleyman.com', 'Purchasing Agent', '5742234934', '2602272295', '105', 'WM-ROCHESTER', 'PURCHASING', true),
  ('Lisa', 'Weissert', 'Lisa Weissert', 'lisaweissert@whitleyman.com', 'Systems Coordinator', '5742234934', '5747075844', '107', 'WM-ROCHESTER', 'IT', true),
  ('Benjamin', 'Wilson', 'Benjamin Wilson', 'benjaminwilson@whitleyman.com', 'Draftsman', '5742234934', '9124928425', '110', 'WM-ROCHESTER', 'DRAFTING', true),
  ('Whitney', 'Farris', 'Whitney Farris', 'whitneyfarris@whitleyman.com', 'Quality Control Manager', '5742234934', '5742303891', '102', 'WM-ROCHESTER', 'QUALITY', true),
  ('Vince', 'Mettler', 'Vince Mettler', 'mbi.qc.plant2@whitleyman.com', 'Quality Control P2', '5742234934', '7654692240', '113', 'WM-ROCHESTER', 'QUALITY', true);

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
