-- ============================================================================
-- STEP 8: IMPORT DIRECTORY CONTACTS
-- ============================================================================
-- Imports all Sunbelt employees from the company directory Excel file.
-- Source: docs/Sunbelt Directory Q3-2025 Updated 07-25-25.xlsx
-- Total: 311 contacts across 15 factories
--
-- Created: January 14, 2026
-- ============================================================================

-- ============================================================================
-- CLEAR EXISTING DIRECTORY DATA
-- ============================================================================
TRUNCATE TABLE directory_contacts CASCADE;

-- ============================================================================
-- IMPORT ALL DIRECTORY CONTACTS (311 total)
-- ============================================================================
INSERT INTO directory_contacts (first_name, last_name, position, department_code, factory_code, email, phone_main, phone_extension, phone_direct, phone_cell)
VALUES
  -- ========================================================================
  -- SNB - SUNBELT CORPORATE (72 contacts)
  -- ========================================================================
  ('Ron', 'Procunier', 'Chief Executive Officer (CEO)', 'EXECUTIVE', 'SNB', NULL, '(602) 447-6460', NULL, NULL, NULL),
  ('Bob', 'Lahmann', 'Chief Financial Officer (CFO)', 'EXECUTIVE', 'SNB', 'bob.lahmann@sunbeltmodular.com', NULL, NULL, NULL, '(410) 300-7926'),
  ('Gary', 'Davenport', 'Chief Revenue Office (CRO)', 'EXECUTIVE', 'SNB', 'gary.davenport@sunbeltmodular.com', NULL, NULL, NULL, '(704) 619-3665'),
  ('Mitch', 'Marois', 'Director of FP&A', 'ACCOUNTING', 'SNB', 'mitch.marois@sunbeltmodular.com', '(602) 447-6460', '138', NULL, '(602) 579-3316'),
  ('Irina', 'Lee', 'FP&A Analyst', 'ACCOUNTING', 'SNB', 'irina.lee@sunbeltmodular.com', NULL, NULL, NULL, '(623) 693-7203'),
  ('Dawn', 'Polk', 'Cost Acct Manager - East', 'ACCOUNTING', 'SNB', 'dawn.polk@sunbeltmodular.com', NULL, NULL, NULL, '(912) 381-2106'),
  ('Wendy', 'Li', 'Corporate Controller', 'ACCOUNTING', 'SNB', 'wendy.li@sunbeltmodular.com', '(602) 447-6460', '303', NULL, '(602) 910-8008'),
  ('Demi', 'Nguyen', 'Senior GL Analyst', 'ACCOUNTING', 'SNB', 'demi.nguyen@sunbeltmodular.com', '(602) 447-6460', '302', NULL, '(602) 717-0801'),
  ('Aina', 'Padasdao', 'Staff Accountant', 'ACCOUNTING', 'SNB', 'aina.padasdao@sunbeltmodular.com', '(602) 447-6460', '301', NULL, NULL),
  ('Ibet', 'Murillo', 'Vice President of HR & Integration', 'EXECUTIVE', 'SNB', 'ibet.murillo@sunbeltmodular.com', '(602) 447-6460', '112', NULL, '(602) 466-8456'),
  ('Argelia', 'Gonzalez', 'Benefits/Payroll Supervisor', 'HR', 'SNB', 'argelia.gonzalez@sunbeltmodular.com', '(602) 447-6460', '124', NULL, '(602) 541-1021'),
  ('Kaitlyn', 'Pogue', 'HR Compliance Specialist', 'HR', 'SNB', 'kaitlyn.pogue@sunbeltmodular.com', '(208) 781-7012', NULL, NULL, '(208) 869-4297'),
  ('Toni', 'Jacoby', 'Director of Marketing', 'MARKETING', 'SNB', 'toni.jacoby@sunbeltmodular.com', NULL, NULL, NULL, '(602) 768-9265'),
  ('Ashley', 'Camp', 'Marketing Coordinator & Event Planner', 'MARKETING', 'SNB', 'ashley.camp@sunbeltmodular.com', '(352) 728-2930', '336', NULL, '(928) 920-9171'),
  ('Frank', 'Monahan', 'Vice President of Business Development', 'EXECUTIVE', 'SNB', 'frank.monahan@sunbeltmodular.com', NULL, NULL, NULL, '(602) 793-4869'),
  ('Andreas', 'Klinckwort', 'Sales Manager - Energy', 'SALES', 'SNB', 'aklinckwort@britcousa.com', '(254) 741-6701', NULL, NULL, '(281) 384-6072'),
  ('Thomas', 'Cassity', 'Business Development - Healthcare', 'SALES', 'SNB', 'tom.cassity@sunbeltmodular.com', '(352) 728-2930', '321', NULL, '(352) 626-3313'),
  ('Desiree', 'Galan', 'Business Development', 'SALES', 'SNB', 'desiree.galan@sunbeltmodular.com', '(602) 447-6460', '102', NULL, '(602) 397-5465'),
  ('Edwin', 'Villegas', 'Designer', 'DRAFTING', 'SNB', 'edwin.villegas@sunbeltmodular.com', '(352) 728-2930', NULL, NULL, NULL),
  ('Brent', 'Morgan', 'Vice President of Sales (Central)', 'EXECUTIVE', 'SNB', 'bmorgan@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 313-8306'),
  ('Jason', 'King', 'Sales Manager - Major Projects (Central)', 'SALES', 'SNB', 'jason.king@sunbeltmodular.com', '(602) 447-6460', '122', NULL, '(602) 781-5134'),
  ('Casey', 'Tanner', 'Vice President of Sales (East)', 'EXECUTIVE', 'SNB', 'casey.tanner@sunbeltmodular.com', NULL, NULL, NULL, '(912) 381-2757'),
  ('Barbara', 'Hicks', 'Sales Manager - Major Projects (East)', 'SALES', 'SNB', 'barbara.hicks@sunbeltmodular.com', NULL, NULL, NULL, '(229) 815-8960'),
  ('Roger', 'Suggs', 'Sales & Estimating', 'SALES', 'SNB', 'roger.suggs@sunbeltmodular.com', NULL, NULL, NULL, '(706) 681-6819'),
  ('Johnny', 'Haskins', 'Sales & Estimating', 'SALES', 'SNB', 'johnny.haskins@sunbeltmodular.com', NULL, NULL, NULL, '(912) 393-5804'),
  ('Jay', 'Vanvlerah', 'Vice President of Sales (West)', 'EXECUTIVE', 'SNB', 'jay.vanvlerah@sunbeltmodular.com', NULL, NULL, NULL, '(214) 207-4044'),
  ('Casey', 'Knipp', 'Sales Manager - Major Projects (West)', 'SALES', 'SNB', 'casey.knipp@sunbeltmodular.com', '(602) 447-6460', '106', NULL, '(602) 781-5208'),
  ('George', 'Avila', 'Sales Estimator - Major Projects (West)', 'SALES', 'SNB', 'george.avila@sunbeltmodular.com', NULL, NULL, NULL, '(480) 617-8727'),
  ('Leah', 'Curtis', 'Sales & Estimating', 'SALES', 'SNB', 'leah.curtis@sunbeltmodular.com', '(602) 447-6460', '117', NULL, '(602) 781-6563'),
  ('Michael', 'Schmid', 'Sales & Estimating', 'SALES', 'SNB', 'michael.schmid@sunbeltmodular.com', NULL, NULL, NULL, '(720) 766-5759'),
  ('Nydia', 'Mora', 'Sales & Estimating', 'SALES', 'SNB', 'nydia.mora@phoenixmodular.com', '(602) 447-6460', '141', NULL, NULL),
  ('Jay', 'Daniels', 'Vice President of Operations', 'EXECUTIVE', 'SNB', 'jay.daniels@sunbeltmodular.com', '(602) 447-6460', '129', NULL, '(602) 327-4768'),
  ('Kim', 'Souvannarath', 'Estimating & Inventory Systems Manager', 'SALES', 'SNB', 'kim.souvannarath@sunbeltmodular.com', '(602) 447-6460', '304', NULL, '(623) 261-0129'),
  ('Monica', 'Mora', 'Purchasing Assistant', 'PURCHASING', 'SNB', 'monica.mora@sunbeltmodular.com', '(602) 447-6460', '134', NULL, NULL),
  ('David', 'Mejia', 'Vice President of Estimating & Inventory Systems', 'EXECUTIVE', 'SNB', 'david.mejia@sunbeltmodular.com', '(602) 447-6460', '104', NULL, '(602) 327-4770'),
  ('David', 'Sousa', 'IT Manager - West', 'IT', 'SNB', 'david.sousa@sunbeltmodular.com', '(602) 447-6460', '139', NULL, '(602) 478-1531'),
  ('Roy', 'Ray', 'IT Manager - East', 'IT', 'SNB', 'ron.ray@sunbeltmodular.com', NULL, NULL, NULL, NULL),
  ('Joy', 'Thomas', 'Lead Programmer', 'IT', 'SNB', 'joy.thomas@sunbeltmodular.com', NULL, NULL, NULL, '(480) 688-8899'),
  ('Aaron', 'Olheiser', 'Network Administrator', 'IT', 'SNB', 'aaron.olheiser@sunbeltmodular.com', NULL, NULL, NULL, '(480) 599-6918'),
  ('Mark', 'Mirgon', 'System Administrator', 'IT', 'SNB', 'mark.mirgon@sunbeltmodular.com', '(602) 447-6460', '305', NULL, NULL),
  ('Frank', 'Delucia', 'Director of Purchasing', 'PURCHASING', 'SNB', 'frank.delucia@sunbeltmodular.com', '(602) 447-6460', '103', NULL, '(602) 582-4368'),
  ('Crystal', 'Diaz', 'Commodity Specialist', 'PURCHASING', 'SNB', 'crystal.diaz@sunbeltmodular.com', '(602) 447-6460', '111', NULL, '(623) 432-2447'),
  ('Ryan', 'Mercado', 'Purchasing Assistant', 'PURCHASING', 'SNB', 'ryan.mercado@sunbeltmodular.com', '(602) 447-6460', '108', NULL, NULL),
  ('Devin', 'Duvak', 'Vice President of Manufacturing', 'EXECUTIVE', 'SNB', 'devin.duvak@sunbeltmodular.com', '(817) 447-1213', '5801', NULL, '(817) 559-3737'),
  ('Joe', 'Hall', 'Director of Manufacturing (East)', 'OPERATIONS', 'SNB', 'joe.hall@sunbeltmodular.com', '(229) 937-5401', NULL, NULL, '(229) 938-4640'),
  ('Candace', 'Juhnke', 'Project Manager', 'OPERATIONS', 'SNB', 'candy.juhnke@sunbeltmodular.com', NULL, NULL, NULL, '(602) 803-7224'),
  ('Crystal', 'Myers', 'Project Manager', 'OPERATIONS', 'SNB', 'crystal.myers@sunbeltmodular.com', NULL, NULL, NULL, NULL),
  ('Michael', 'Caracciolo', 'Project Manager', 'OPERATIONS', 'SNB', 'michael.caracciolo@sunbeltmodular.com', NULL, NULL, NULL, '(480) 848-1076'),
  ('Matthew', 'McDaniel', 'Project Manager', 'OPERATIONS', 'SNB', 'matthew.mcdaniel@sunbeltmodular.com', NULL, NULL, NULL, '(480) 848-4715'),
  ('Hector', 'Vazquez', 'Project Manager', 'OPERATIONS', 'SNB', 'hector.vazquez@sunbeltmodular.com', NULL, NULL, NULL, '(254) 500-4038'),
  ('Lois', 'Plymale', 'Architect', 'DRAFTING', 'SNB', 'lois.plymale@sunbeltmodular.com', '(352) 728-2930', NULL, NULL, '(352) 774-1679'),
  ('Michael', 'Grimes', 'Lead Drafter', 'DRAFTING', 'SNB', 'michael.grimes@sunbeltmodular.com', NULL, NULL, NULL, '(352) 910-3963'),
  ('Shaylon', 'Vaughn', 'Director of Engineering', 'ENGINEERING', 'SNB', 'shaylon.vaughn@sunbeltmodular.com', NULL, NULL, NULL, '(623) 202-3528'),
  ('Jasmin', 'Vicente', 'Engineer', 'ENGINEERING', 'SNB', 'jasmin.vicente@sunbeltmodular.com', NULL, NULL, NULL, '(425) 501-1234'),
  ('Valerie', 'Eskelsen', 'Engineer', 'ENGINEERING', 'SNB', 'valerie.eskelsen@sunbeltmodular.com', NULL, NULL, NULL, NULL),
  ('Louis', 'Cribb', 'Engineer', 'ENGINEERING', 'SNB', 'louis.cribb@sunbeltmodular.com', NULL, NULL, NULL, '(574) 903-3610'),
  ('Robert', 'Berry', 'Engineer', 'ENGINEERING', 'SNB', 'robert.berry@sunbeltmodular.com', NULL, NULL, NULL, '(602) 826-7014'),
  ('Roger', 'DeChavez', 'Engineer', 'ENGINEERING', 'SNB', 'roger.dechavez@sunbeltmodular.com', NULL, NULL, NULL, '(480) 647-9242'),
  ('Mark', 'Lindsay', 'Plan Examiner', 'DRAFTING', 'SNB', 'mark.lindsay@sunbeltmodular.com', NULL, NULL, NULL, '(480) 407-9519'),
  ('Michael', 'Schneider', 'Director of Drafting', 'DRAFTING', 'SNB', 'michael.schneider@sunbeltmodular.com', '(602) 447-6460', '115', NULL, '(214) 435-6267'),
  ('Valerie', 'Edmond', 'Drafting Manager - Eastern Region', 'DRAFTING', 'SNB', 'valerie.edmond@sunbeltmodular.com', '(602) 447-6460', NULL, NULL, '(480) 427-5330'),
  ('Russ', 'Kory', 'Drafting Manager - West Region', 'DRAFTING', 'SNB', 'russ.kory@sunbeltmodular.com', '(602) 447-6460', '132', NULL, '(480) 888-5037'),
  ('Kyle', 'Nissen', 'Drafter', 'DRAFTING', 'SNB', 'kyle.nissen@sunbeltmodular.com', '(602) 447-6460', '131', NULL, NULL),
  ('Rafael', 'Quiros', 'Drafter', 'DRAFTING', 'SNB', 'rafael.quiros@sunbeltmodular.com', '(602) 447-6460', '107', NULL, NULL),
  ('Christopher', 'Burgos', 'Drafter', 'DRAFTING', 'SNB', 'chris.burgos@sunbeltmodular.com', '(817) 447-1213', '5807', NULL, NULL),
  ('Lemon', 'Henry', 'Drafter', 'DRAFTING', 'SNB', 'lemon.henry@sunbeltmodular.com', '(602) 447-6460', '133', NULL, NULL),
  ('Marci', 'Mitchell', 'Director of Safety & Warranty', 'SAFETY', 'SNB', 'marci.mitchell@sunbeltmodular.com', '(602) 447-6460', '101', NULL, '(602) 803-0507'),
  ('Greg', 'Berry', 'Technical Support Manager', 'SERVICE', 'SNB', 'greg.berry@sunbeltmodular.com', NULL, NULL, NULL, '(817) 557-7870'),

  -- ========================================================================
  -- AMT - AMTEX (19 contacts)
  -- ========================================================================
  ('Noel', 'Lindsey', 'Plant General Manager', 'OPERATIONS', 'AMT', 'noel.lindsey@amtexcorp.com', '(972) 276-7626', '107', NULL, '(214) 450-0546'),
  ('Darian', 'Curry', 'Accounting Manager', 'ACCOUNTING', 'AMT', 'darian.curry@amtexcorp.com', '(972) 276-7626', '110', NULL, '(469) 724-0141'),
  ('Lucero', 'Martinez', 'Accounts Payable', 'ACCOUNTING', 'AMT', 'lucero.martinez@amtexcorp.com', '(972) 276-7626', '102', NULL, NULL),
  ('Michelle', 'Ponce', 'Administrative Assistant', 'OPERATIONS', 'AMT', 'michelle.ponce@amtexcorp.com', '(972) 276-7626', '100', NULL, NULL),
  ('Kelly', 'Kellie', 'Sales Manager', 'SALES', 'AMT', 'kelly.kellie@amtexcorp.com', '(972) 276-7626', '103', NULL, '(469) 416-9979'),
  ('Liz', 'Ramirez', 'Estimator', 'SALES', 'AMT', 'liz.ramirez@amtexcorp.com', '(972) 276-7626', '105', NULL, NULL),
  ('Dyonatan', 'Cysz', 'Estimator', 'SALES', 'AMT', 'dyonatan.cysz@amtexcorp.com', '(972) 276-7626', '112', NULL, NULL),
  ('Luis', 'Resendiz', 'Production Manager', 'PRODUCTION', 'AMT', 'luis.resendiz@amtexcorp.com', '(972) 276-7626', '117', NULL, '(214) 734-4582'),
  ('Humberto', 'Mendez', 'Production Supervisor', 'PRODUCTION', 'AMT', 'humberto.mendez@amtexcorp.com', '(972) 276-7626', '109', NULL, '(214) 551-9754'),
  ('Tommy', 'Garcia', 'Purchasing Manager', 'PURCHASING', 'AMT', 'tommy.garcia@amtexcorp.com', '(972) 276-7626', '115', NULL, '(469) 690-5288'),
  ('David', 'Flores', 'Purchasing Assistant', 'PURCHASING', 'AMT', 'david.flores@amtexcorp.com', '(972) 276-7626', '104', NULL, '(972) 768-0062'),
  ('Walter', 'Portillo', 'Material Control Supervisor', 'PURCHASING', 'AMT', 'walter.portillo@amtexcorp.com', '(972) 276-7626', '104', NULL, NULL),
  ('Alexander', 'Fontenarosa', 'Project Coordinator', 'OPERATIONS', 'AMT', 'alex.fontenarosa@amtexcorp.com', '(972) 276-7626', '113', NULL, NULL),
  ('Edward', 'Vrzalik', 'Drafting Manager', 'DRAFTING', 'AMT', 'edward.vrzalik@amtexcorp.com', '(972) 276-7626', '108', NULL, NULL),
  ('Rochelle', 'Da Costa', 'Drafter', 'DRAFTING', 'AMT', 'rochelle.costa@amtexcorp.com', '(972) 276-7626', '108', NULL, NULL),
  ('Roy', 'Thompson', 'Quality Assurance Manager', 'QUALITY', 'AMT', 'roy.thompson@amtexcorp.com', '(972) 276-7626', '106', NULL, '(214) 551-1936'),
  ('John', 'Mellet', 'Safety Coordinator', 'SAFETY', 'AMT', 'john.mellett@amtexcorp.com', '(972) 276-7626', NULL, NULL, '(214) 930-0127'),
  ('Jose', 'Contreras', 'AMP Coordinator', 'PRODUCTION', 'AMT', 'jose.contreras@amtexcorp.com', '(972) 276-7626', NULL, NULL, '(972) 955-0371'),
  ('Gabriel', 'Sanchez', 'Weld Shop Manager', 'PRODUCTION', 'AMT', 'gabriel.sanchez@amtexcorp.com', NULL, NULL, NULL, '(214) 551-0964'),

  -- ========================================================================
  -- BUSA - BRITCO USA (17 contacts)
  -- ========================================================================
  ('Jeremy', 'Jensen', 'Plant General Manager', 'OPERATIONS', 'BUSA', 'jeremy.jensen@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 633-7766'),
  ('Steve', 'Hall', 'Accounting Manager', 'ACCOUNTING', 'BUSA', 'steve.hall@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 744-5948'),
  ('Marily', 'Hernandez', 'Accounts Payable; HR/Payroll Specialist', 'ACCOUNTING', 'BUSA', 'marily.palacios@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 495-3492'),
  ('Eduardo', 'Tabora', 'Estimating Manager/Sales', 'SALES', 'BUSA', 'edward.tabora@britcousa.com', '(254) 741-6701', NULL, NULL, '(832) 876-2047'),
  ('Craven', 'Powers', 'Estimator', 'SALES', 'BUSA', 'craven.powers@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 231-9077'),
  ('William', 'Luna', 'Estimator', 'SALES', 'BUSA', 'william.luna@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 878-4708'),
  ('Ricardo', 'Montalvo', 'Production Manager', 'PRODUCTION', 'BUSA', 'ricardo.montalvo@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 722-1517'),
  ('Kimberly', 'Webb', 'Purchasing Manager', 'PURCHASING', 'BUSA', 'kimberly.webb@britcousa.com', '(254) 741-6701', NULL, NULL, '(817) 706-3149'),
  ('Heriberto', 'Montalvo', 'Purchasing Assistant', 'PURCHASING', 'BUSA', 'eddie.montalvo@britcousa.com', '(254) 741-6701', NULL, NULL, '(936) 676-0718'),
  ('Terry', 'Davis', 'Material Control/Receiving', 'PURCHASING', 'BUSA', 'terry.davis@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 716-6020'),
  ('Jaime', 'Moreno', 'Project Coordinator', 'OPERATIONS', 'BUSA', 'jaime.moreno@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 230-7441'),
  ('Scott', 'Rees', 'Engineering/Contracts Manager', 'ENGINEERING', 'BUSA', 'scott.rees@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 315-4073'),
  ('Mark', 'Jackson', 'Drafter', 'DRAFTING', 'BUSA', 'mark.jackson@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 447-2496'),
  ('Javier', 'Rodriguez', 'Drafter', 'DRAFTING', 'BUSA', 'javier.rodriguez@britcousa.com', '(254) 741-6701', NULL, NULL, '(956) 563-7444'),
  ('Angel', 'Diaz', 'Quality Control/Service Manager', 'QUALITY', 'BUSA', 'angel.diaz@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 313-8350'),
  ('Juan', 'Ontiveros', 'Quality Control', 'QUALITY', 'BUSA', 'juan.ontiveros@britcousa.com', '(254) 741-6701', NULL, NULL, '(254) 313-8359'),
  ('Patty', 'Mosley', 'Safety Coordinator', 'SAFETY', 'BUSA', 'patty.mosley@britcousa.com', '(254) 741-6701', NULL, NULL, '(903) 467-6898'),

  -- ========================================================================
  -- C&B - C&B CUSTOM MODULAR (11 contacts)
  -- ========================================================================
  ('Chris', 'Chadwick', 'Plant General Manager', 'OPERATIONS', 'C&B', 'chris.chadwick@candbmod.com', '(574) 848-7300', '127', NULL, '(574) 596-4468'),
  ('Pam', 'Chadwick', 'Accounting Manager', 'ACCOUNTING', 'C&B', 'pam.chadwick@candbmod.com', '(574) 848-7300', '112', NULL, '(574) 596-5505'),
  ('Candace', 'Kafka', 'Human Resources/Safety', 'HR', 'C&B', 'candace.kafka@candbmod.com', '(574) 848-7300', '124', NULL, NULL),
  ('Lewis', 'Chadwick', 'Sales Manager', 'SALES', 'C&B', 'lewis.chadwick@candbmod.com', '(574) 848-7300', '106', NULL, NULL),
  ('Shannon', 'Robinson', 'Sales', 'SALES', 'C&B', 'shannon.robinson@candbmod.com', '(574) 848-7300', '113', NULL, NULL),
  ('Shawn', 'Collins', 'Purchasing Manager', 'PURCHASING', 'C&B', 'shawn.collins@candbmod.com', '(574) 848-7300', '128', NULL, NULL),
  ('Dawn', 'Hout', 'Purchasing', 'PURCHASING', 'C&B', 'dawn.hout@candbmod.com', '(574) 848-7300', '130', NULL, NULL),
  ('Steve', 'Reynolds', 'Project Coordinator', 'OPERATIONS', 'C&B', 'steve.reynolds@candbmod.com', '(574) 848-7300', '108', NULL, NULL),
  ('Becky', 'Bradbury', 'Drafting Manager', 'DRAFTING', 'C&B', 'becky.bradbury@candbmod.com', '(574) 848-7300', '104', NULL, NULL),
  ('Guy', 'Vaughn', 'Drafter', 'DRAFTING', 'C&B', 'guy.vaughn@candbmod.com', '(574) 848-7300', '107', NULL, NULL),
  ('Brandon', 'Kafka', 'Safety/QC/Dispatch', 'QUALITY', 'C&B', 'brandon.kafka@candbmod.com', '(574) 848-7300', NULL, NULL, NULL),

  -- ========================================================================
  -- IBI - INDICOM BUILDINGS (22 contacts)
  -- ========================================================================
  ('Beth', 'Berry', 'Plant General Manager', 'OPERATIONS', 'IBI', 'beth.berry@indicombuildings.com', '(817) 447-1213', '5814', NULL, '(817) 915-3844'),
  ('Patsy', 'Mejia', 'Accounting Supervisor', 'ACCOUNTING', 'IBI', 'patsy.mejia@indicombuildings.com', '(817) 447-1213', '5835', NULL, '(817) 357-9214'),
  ('Ashley', 'Fabela', 'HR/Payroll Assistant', 'HR', 'IBI', 'ashley.fabela@indicombuildings.com', '(817) 447-1213', '5802', NULL, NULL),
  ('Amy', 'Davila', 'Admin. Assistant/A/P', 'ACCOUNTING', 'IBI', 'amy.davila@indicombuildings.com', '(817) 447-1213', '5800', NULL, NULL),
  ('Levi', 'Porter', 'Sales Manager', 'SALES', 'IBI', 'levi.porter@indicombuildings.com', '(817) 447-1213', '5840', NULL, '(682) 347-8050'),
  ('Jose', 'Ramirez', 'Sales & Estimating', 'SALES', 'IBI', 'jose.ramirez@indicombuildings.com', '(817) 447-1213', '5847', NULL, '(817) 774-1181'),
  ('Alex', 'Fabela', 'Sales & Estimating', 'SALES', 'IBI', 'alex.fabela@indicombuildings.com', '(817) 447-1213', '5815', NULL, NULL),
  ('Tiffany', 'Stephens', 'Sales & Estimating', 'SALES', 'IBI', 'tiffany.stephens@indicombuildings.com', '(817) 447-1213', '5806', NULL, NULL),
  ('Frank', 'Saenz', 'Production Manager', 'PRODUCTION', 'IBI', 'frank.saenz@indicombuildings.com', '(817) 447-1213', '5842', NULL, NULL),
  ('Tichelle', 'Halford', 'Purchasing Manager', 'PURCHASING', 'IBI', 'tichelle.halford@indicombuildings.com', '(817) 447-1213', '5824', NULL, NULL),
  ('Andy', 'Love', 'Purchasing Agent', 'PURCHASING', 'IBI', 'andy.love@indicombuildings.com', '(817) 447-1213', '5821', NULL, NULL),
  ('Anne', 'Perez', 'Material Control', 'PURCHASING', 'IBI', 'anne.perez@indicombuildings.com', '(817) 447-1213', '5803', NULL, NULL),
  ('Lisa', 'Linn', 'Project Coordinator', 'OPERATIONS', 'IBI', 'lisa.linn@indicombuildings.com', '(817) 447-1213', '5813', NULL, NULL),
  ('Matthew', 'Scott', 'Engineering Manager', 'ENGINEERING', 'IBI', 'matthew.scott@indicombuildings.com', '(817) 447-1213', '5831', NULL, '(817) 774-1206'),
  ('David', 'Walker', 'Architectural Designer', 'DRAFTING', 'IBI', 'david.walker@indicombuildings.com', '(817) 447-1213', '5833', NULL, NULL),
  ('Randy', 'Walker', 'Design Drafter', 'DRAFTING', 'IBI', 'randy.walker@indicombuildings.com', NULL, NULL, NULL, '(608) 572-3867'),
  ('Eliud', 'Saenz', 'Design Drafter', 'DRAFTING', 'IBI', 'eliud.saenz@indicombuildings.com', '(817) 447-1213', '5804', NULL, NULL),
  ('Gabriel', 'Moreno', 'Design Drafter', 'DRAFTING', 'IBI', 'gabriel.moreno@indicombuildings.com', '(817) 447-1213', '5832', NULL, NULL),
  ('Erik', 'Fabela', 'Warranty/QC Manager', 'QUALITY', 'IBI', 'erik.fabela@indicombuildings.com', '(817) 447-1213', '5841', NULL, '(817) 691-7954'),
  ('Nataly', 'Chaidez', 'Safety Coordinator', 'SAFETY', 'IBI', 'nataly.chaidez@indicombuildings.com', '(817) 447-1213', '5808', NULL, NULL),
  ('Jay', 'Stratton', 'QC/Transportation Supervisor', 'SERVICE', 'IBI', 'jay.stratton@indicombuildings.com', '(817) 447-1213', '5822', NULL, NULL),
  ('Marvin', 'McGahan', 'Warranty Service', 'SERVICE', 'IBI', 'marvin.mcgahan@indicombuildings.com', NULL, NULL, NULL, '(682) 318-5599'),

  -- ========================================================================
  -- MRS - MR STEEL (10 contacts)
  -- ========================================================================
  ('Dan', 'King', 'Plant General Manager', 'OPERATIONS', 'MRS', 'dan.king@mrsteel.com', '(602) 278-3355', '105', NULL, '(602) 327-4772'),
  ('Nick', 'Tran', 'Accounting Manager', 'ACCOUNTING', 'MRS', 'nick.tran@mrsteel.com', '(602) 278-3355', '111', NULL, '(602) 762-0501'),
  ('Dawn', 'Vollmer', 'Administrative Assistant', 'OPERATIONS', 'MRS', 'dawn.vollmer@mrsteel.com', '(602) 278-3355', '100', NULL, NULL),
  ('Juan', 'Figueroa', 'Sales Manager', 'SALES', 'MRS', 'juan.figueroa@mrsteel.com', '(602) 278-3355', '101', NULL, '(602) 677-3964'),
  ('Dylan', 'King', 'Sales Coordinator', 'SALES', 'MRS', 'dylan.king@mrsteel.com', '(602) 278-3355', '112', NULL, '(602) 291-0665'),
  ('Gary', 'Allen', 'Production Manager', 'PRODUCTION', 'MRS', 'gary.allen@mrsteel.com', '(602) 278-3355', '107', NULL, '(602) 214-5983'),
  ('Tim', 'Woods', 'Foreman', 'PRODUCTION', 'MRS', 'tim.woods@mrsteel.com', '(602) 278-3355', '106', NULL, '(602) 762-4629'),
  ('LaQuana', 'Allen', 'Purchasing Assistant', 'PURCHASING', 'MRS', 'laquana.yazzie@mrsteel.com', '(602) 278-3355', '114', NULL, '(928) 920-5564'),
  ('Willie', 'Shackleford', 'Estimating/Purchasing/Machine Shop Manager', 'SALES', 'MRS', 'willie.shackleford@mrsteel.com', '(602) 278-3355', '103', NULL, '(602) 370-5921'),
  ('Robert', 'Elizondo', 'Safety Coordinator', 'SAFETY', 'MRS', 'robert.elizondo@mrsteel.com', '(602) 278-3355', '110', NULL, NULL),

  -- ========================================================================
  -- NWBS - NORTHWEST BUILDING SYSTEMS (20 contacts)
  -- ========================================================================
  ('Ross', 'Parks', 'Plant General Manager', 'OPERATIONS', 'NWBS', 'ross.parks@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7008', '(208) 866-3615'),
  ('Jenn', 'Parks', 'Accounting Manager', 'ACCOUNTING', 'NWBS', 'jenn.parks@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7006', '(208) 860-2719'),
  ('Alondra', 'Vargas', 'HR/Payroll Specialist', 'HR', 'NWBS', 'alondra.vargas@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7031', NULL),
  ('Jennifer', 'Lonergan', 'Office Admin/AP', 'OPERATIONS', 'NWBS', 'jennifer.lonergan@nwbsinc.com', '(208) 344-3527', '0', '(208) 781-7014', NULL),
  ('Mitch', 'Quintana', 'Sales Manager', 'SALES', 'NWBS', 'mitch.quintana@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7005', '(208) 860-2582'),
  ('Robert', 'Thaler', 'Estimator', 'SALES', 'NWBS', 'robert.thaler@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7011', '(208) 860-2763'),
  ('Justin', 'Downing', 'Production Manager', 'PRODUCTION', 'NWBS', 'justin.downing@nwbsinc.com', '(208) 344-3527', '9', '(208) 781-7025', '(208) 713-9828'),
  ('Steve', 'Cummings', 'Plant Manager 1', 'OPERATIONS', 'NWBS', 'steve.cummings@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7026', NULL),
  ('Ronnie', 'Ludquist', 'Plant Manager 2', 'OPERATIONS', 'NWBS', 'ronald.lundquist@nwbsinc.com', '(208) 344-3527', NULL, NULL, NULL),
  ('Russ', 'Metzger', 'Purchasing Manager', 'PURCHASING', 'NWBS', 'russ.metzger@nwbsinc.com', '(208) 344-3527', '1', '(208) 781-7009', '(208) 867-4781'),
  ('Justin', 'Weast', 'Purchasing Assistant', 'PURCHASING', 'NWBS', 'justin.weast@nwbsinc.com', '(208) 344-3527', '7', '(208) 781-7023', '(208) 605-9974'),
  ('Cassey', 'Brandon', 'Material Control', 'PURCHASING', 'NWBS', 'cassey.brandon@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7016', '(208) 576-5325'),
  ('Kelly', 'Daniels', 'Drafter', 'DRAFTING', 'NWBS', 'kelly.daniels@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7018', '(208) 484-1662'),
  ('James', 'McLeod', 'Drafter', 'DRAFTING', 'NWBS', 'james.mcleod@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7010', NULL),
  ('Trent', 'Thomson', 'Quality Assurance Manager', 'QUALITY', 'NWBS', 'trent.thomson@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7028', '(208) 405-1197'),
  ('Jeff', 'Murray', 'Safety Coordinator', 'SAFETY', 'NWBS', 'jeff.murray@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7022', '(208) 573-7322'),
  ('Steve', 'Jackman', 'QC/Transport Supervisor', 'SERVICE', 'NWBS', 'steven.jackman@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7021', NULL),
  ('Sepp', 'Braun', 'Service Technician', 'SERVICE', 'NWBS', 'sepp.braun@nwbsinc.com', '(208) 344-3527', '8', '(208) 781-7017', '(208) 968-8710'),
  ('Jerad', 'Martindale', 'Maintenance', 'SERVICE', 'NWBS', 'jerad.martindale@nwbsinc.com', '(208) 344-3527', NULL, '(208) 781-7024', '(208) 841-3865'),

  -- ========================================================================
  -- PMI - PHOENIX MODULAR (22 contacts)
  -- ========================================================================
  ('Monty', 'King', 'Plant General Manager', 'OPERATIONS', 'PMI', 'monty.king@phoenixmodular.com', '(602) 447-6460', '116', NULL, '(602) 327-4771'),
  ('Amber', 'Chase', 'Plant Accounting Manager', 'ACCOUNTING', 'PMI', 'amber.chase@phoenixmodular.com', '(602) 447-6460', '306', NULL, '(605) 376-5322'),
  ('Susie', 'Ayala', 'HR/Payroll Specialist', 'HR', 'PMI', 'susie.ayala@phoenixmodular.com', '(602) 447-6460', '120', NULL, NULL),
  ('Melanie', 'Kenyon', 'A/P Specialist', 'ACCOUNTING', 'PMI', 'melanie.kenyon@phoenixmodular.com', '(602) 447-6460', '128', NULL, NULL),
  ('Sonia', 'Quezada', 'Administrative Assistant', 'OPERATIONS', 'PMI', 'sonia.quezada@phoenixmodular.com', '(602) 447-6460', '100', NULL, NULL),
  ('Brian', 'Shackleford', 'Sales Manager', 'SALES', 'PMI', 'brian.shackleford@phoenixmodular.com', '(602) 447-6460', '105', NULL, '(602) 397-5474'),
  ('Angela', 'Perillo', 'Sales & Estimating', 'SALES', 'PMI', 'angela.perillo@phoenixmodular.com', '(602) 447-6460', '127', NULL, NULL),
  ('Chris', 'Thomas', 'Sales & Estimating', 'SALES', 'PMI', 'chris.thomas@sunbeltmodular.com', '(602) 447-6460', '136', NULL, NULL),
  ('Dominic', 'Delucia', 'Sales & Estimating', 'SALES', 'PMI', 'dominic.delucia@phoenixmodular.com', '(602) 447-6460', NULL, NULL, NULL),
  ('Rafael', 'Quiros', 'Production Manager', 'PRODUCTION', 'PMI', 'rafael.quiros@phoenixmodular.com', '(602) 447-6460', '135', NULL, '(602) 320-6044'),
  ('Sam', 'Murillo', 'Purchasing Manager', 'PURCHASING', 'PMI', 'sam.murillo@phoenixmodular.com', '(602) 447-6460', '113', NULL, '(602) 803-0066'),
  ('Mariana', 'Martinez', 'Purchasing Assistant', 'PURCHASING', 'PMI', 'mariana.martinez@phoenixmodular.com', '(602) 447-6460', '126', NULL, NULL),
  ('Ramon', 'Armenta', 'Purchasing Assistant', 'PURCHASING', 'PMI', 'ramon.armenta@phoenixmodular.com', '(602) 447-6460', '137', NULL, NULL),
  ('Dawn', 'Lesser', 'Material Control Foreman', 'PRODUCTION', 'PMI', 'dawn.lesser@phoenixmodular.com', '(602) 447-6460', '118', NULL, '(602) 600-2544'),
  ('Jessica', 'Flores', 'Receiving Data Entry Clerk', 'PURCHASING', 'PMI', 'jessica.flores@phoenixmodular.com', '(602) 447-6460', '110', NULL, NULL),
  ('Juanita', 'Earnest', 'Project Coordinator Supervisor', 'OPERATIONS', 'PMI', 'juanita.earnest@phoenixmodular.com', '(602) 447-6460', '121', NULL, NULL),
  ('Rodrigo', 'Mejia', 'Drafting Manager', 'DRAFTING', 'PMI', 'rodrigo.mejia@phoenixmodular.com', '(602) 447-6460', '107', NULL, NULL),
  ('Cody', 'King', 'Drafter', 'DRAFTING', 'PMI', 'cody.king@phoenixmodular.com', '(602) 447-6460', '125', NULL, NULL),
  ('Cristobal', 'Lizarraga', 'Drafter', 'DRAFTING', 'PMI', 'cristobal.lizarraga@phoenixmodular.com', '(602) 447-6460', '125', NULL, NULL),
  ('Shawn', 'Stroh', '(Interim) Quality Assurance Manager', 'QUALITY', 'PMI', 'shawn.stroh@phoenixmodular.com', '(602) 447-6460', '123', NULL, '(602) 330-5439'),
  ('Alex', 'Alvarado Moreno', 'QC/Transport Supervisor', 'SERVICE', 'PMI', 'alexis.alvarado@phoenixmodular.com', '(602) 447-6460', '109', NULL, '(480) 720-8795'),
  ('Donald', 'Hull', 'Safety Coordinator', 'SAFETY', 'PMI', 'don.hull@phoenixmodular.com', '(602) 447-6460', '130', NULL, NULL),

  -- ========================================================================
  -- PRM - PROMOD MANUFACTURING (24 contacts)
  -- ========================================================================
  ('CJ', 'Yarbrough', 'Plant General Manager', 'OPERATIONS', 'PRM', 'cj.yarbrough@promodmfg.com', '(229) 937-5401', '104', NULL, '(229) 942-3495'),
  ('Tina', 'Powell', 'Accounting Manager', 'ACCOUNTING', 'PRM', 'tina.powell@promodmfg.com', '(229) 937-5401', '126', NULL, '(229) 575-8738'),
  ('Lisa', 'James', 'A/P/Receptionist', 'ACCOUNTING', 'PRM', 'lisa.james@promodmfg.com', '(229) 937-5401', '100', NULL, '(229) 938-0023'),
  ('Denise', 'Brown', 'HR/Payroll', 'HR', 'PRM', 'denise.brown@promodmfg.com', '(229) 937-5401', '118', NULL, '(229) 591-8818'),
  ('Dean', 'Long', 'Sales Manager', 'SALES', 'PRM', 'dean.long@promodmfg.com', '(229) 937-5401', '106', NULL, '(229) 314-9326'),
  ('Carmetrick', 'Ross', 'Sales & Estimation', 'SALES', 'PRM', 'carmetrick.ross@promodmfg.com', '(229) 937-5401', '103', NULL, '(229) 942-9688'),
  ('Josh', 'Mattson', 'Sales & Estimation', 'SALES', 'PRM', 'josh.mattson@promodmfg.com', '(229) 937-5401', '114', NULL, '(229) 575-8747'),
  ('Jarrett', 'Long', 'Sales & Estimation', 'SALES', 'PRM', 'jarrett.long@promodmfg.com', '(229) 937-5401', NULL, NULL, '(229) 938-2119'),
  ('Donald', 'Berry', 'Production Manager (ProMod)', 'PRODUCTION', 'PRM', 'duane.berry@promodmfg.com', '(229) 937-5401', '109', NULL, '(229) 942-1482'),
  ('Justin', 'Renfroe', 'Production Manager (ProBox)', 'PRODUCTION', 'PRM', 'justin.renfroe@promodmfg.com', '(229) 937-5401', '116', NULL, '(229) 942-4469'),
  ('Michael', 'Hernandez', 'Purchasing Manager', 'PURCHASING', 'PRM', 'michael.hernandez@promodmfg.com', '(229) 937-5401', '120', NULL, '(229) 314-5290'),
  ('Rufus', 'Yarbrough', 'Purchasing Agent', 'PURCHASING', 'PRM', 'rufus.yarbrough@promodmfg.com', '(229) 937-5401', '122', NULL, '(229) 314-1542'),
  ('Brooke', 'Albritton', 'Material Control', 'PURCHASING', 'PRM', 'brooke.albritton@promodmfg.com', '(229) 937-5401', NULL, NULL, '(229) 815-2929'),
  ('Toby', 'Sexton', 'Project Coordinator', 'OPERATIONS', 'PRM', 'toby.sexton@promodmfg.com', '(229) 937-5401', '110', NULL, '(478) 283-3581'),
  ('Matthew', 'Murphy', 'Drafting Manager', 'DRAFTING', 'PRM', 'matt.murphy@promodmfg.com', '(229) 937-5401', '117', NULL, '(229) 314-1837'),
  ('Jackson', 'Benjamin', 'Drafter', 'DRAFTING', 'PRM', 'jackson.benjamin@promodmfg.com', '(229) 937-5401', '112', NULL, '(229) 942-8353'),
  ('Marvin', 'Horne', 'Drafter', 'DRAFTING', 'PRM', 'marvin.horne@promodmfg.com', '(229) 937-5401', '131', NULL, '(229) 314-9975'),
  ('Pete', 'Yarbrough', 'Service Manager', 'SERVICE', 'PRM', 'pete.yarbrough@promodmfg.com', '(229) 937-5401', '119', NULL, '(352) 267-5431'),
  ('Steve', 'Cleghorn', 'Quality Control', 'QUALITY', 'PRM', 'steve.cleghorn@promodmfg.com', '(229) 937-5401', '102', NULL, '(205) 522-6757'),
  ('Matthew', 'Burns', 'Quality Control', 'QUALITY', 'PRM', 'matt.burns@promodmfg.com', '(229) 937-5401', '123', NULL, '(229) 938-4202'),
  ('Tyler', 'Lynn', 'Quality Control', 'QUALITY', 'PRM', 'tyler.lynn@promodmfg.com', '(229) 937-5401', '130', NULL, '(229) 314-1961'),
  ('Earl', 'Godwin', 'Quality Control', 'QUALITY', 'PRM', 'earl.godwin@promodmfg.com', '(229) 937-5401', NULL, NULL, '(229) 942-3665'),
  ('Donnie', 'Dew', 'Quality Control (ProBox)', 'QUALITY', 'PRM', 'donnie.dew@promodmfg.com', '(229) 937-5401', '128', NULL, '(229) 938-2524'),
  ('Chris', 'Schwarzer', 'Safety', 'SAFETY', 'PRM', 'chris.schwarzer@promodmfg.com', '(229) 937-5401', '124', NULL, '(229) 591-4330'),

  -- ========================================================================
  -- SMM - SOUTHEAST MODULAR MANUFACTURING (17 contacts)
  -- ========================================================================
  ('Joe', 'Reid', 'Plant General Manager', 'OPERATIONS', 'SMM', 'joe.reid@southeastmodular.com', '(352) 728-2930', '301', NULL, '(214) 336-8582'),
  ('Nancy', 'Davis', 'Accounting Manager', 'ACCOUNTING', 'SMM', 'nancy.davis@southeastmodular.com', '(352) 728-2930', '328', NULL, '(352) 446-6978'),
  ('Suzie', 'Nelson', 'HR Specialist', 'HR', 'SMM', 'suzie.nelson@southeastmodular.com', '(352) 728-2930', '314', NULL, '(352) 250-7820'),
  ('Patti', 'Friberg', 'Accounts Payable', 'ACCOUNTING', 'SMM', 'patti.friberg@southeastmodular.com', '(352) 728-2930', '300', NULL, NULL),
  ('Don', 'Eisman', 'Sales Manager', 'SALES', 'SMM', 'don.eisman@southeastmodular.com', '(352) 728-2930', '326', NULL, '(574) 333-7089'),
  ('Roger', 'Diamond', 'Estimating', 'SALES', 'SMM', 'roger.diamond@southeastmodular.com', '(352) 728-2930', '335', NULL, NULL),
  ('Shawn', 'Durante', 'Estimating', 'SALES', 'SMM', 'shawn.durante@southeastmodular.com', '(352) 728-2930', '324', NULL, NULL),
  ('Mike', 'Stoica', 'Production Manager', 'PRODUCTION', 'SMM', 'mike.stoica@southeastmodular.com', '(352) 728-2930', '313', NULL, '(352) 446-6482'),
  ('Cindy', 'Barnes', 'Assist. Production Manager', 'PRODUCTION', 'SMM', 'cindy.barnes@southeastmodular.com', '(352) 728-2930', '305', NULL, '(352) 809-2558'),
  ('Steve', 'Dudley', 'Purchasing Manager', 'PURCHASING', 'SMM', 'steve.dudley@southeastmodular.com', '(352) 728-2930', '310', NULL, '(352) 516-0631'),
  ('Corey', 'Abbott', 'Purchasing Agent', 'PURCHASING', 'SMM', 'corey.abbott@southeastmodular.com', '(352) 728-2930', '334', NULL, '(352) 348-7590'),
  ('Dave', 'McEwen', 'Material Control', 'PURCHASING', 'SMM', 'dave.mcewen@southeastmodular.com', '(352) 728-2930', '315', NULL, '(352) 603-2011'),
  ('Katie', 'Myers', 'Project Coordinator', 'OPERATIONS', 'SMM', 'katie.myers@southeastmodular.com', '(352) 728-2930', '312', NULL, '(352) 626-3577'),
  ('Chris', 'Smith', 'Drafting Manager', 'DRAFTING', 'SMM', 'chris.smith@southeastmodular.com', '(352) 728-2930', '307', NULL, NULL),
  ('Otha', 'Matthews', 'Drafter', 'DRAFTING', 'SMM', 'tommy.matthews@southeastmodular.com', '(352) 728-2930', '307', NULL, NULL),
  ('Zachary', 'Esguerra', 'Drafter', 'DRAFTING', 'SMM', 'zachary.esguerra@southeastmodular.com', '(352) 728-2930', '307', NULL, NULL),
  ('Daniel', 'Lemusmora', 'Quality Assurance Manager', 'QUALITY', 'SMM', 'daniel.lemusmora@southeastmodular.com', '(352) 728-2930', '302', NULL, '(352) 910-3963'),

  -- ========================================================================
  -- SSI - SPECIALIZED STRUCTURES (17 contacts)
  -- ========================================================================
  ('Glenn', 'Gardner', 'Plant General Manager', 'OPERATIONS', 'SSI', 'glenn.gardner@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 534-6111'),
  ('Peggy', 'Forest', 'Accounting Manager', 'ACCOUNTING', 'SSI', 'peggy.forest@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 310-0878'),
  ('Vaneza', 'Aguilar', 'Accounts Payable', 'ACCOUNTING', 'SSI', 'vaneza.aguilar@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Fatima', 'Corona', 'HR/Payroll Specialist', 'HR', 'SSI', 'fatima.corona@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Josh', 'Ellis', 'Sales Manager', 'SALES', 'SSI', 'josh.ellis@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 327-0256'),
  ('Derek', 'Little', 'Estimator', 'SALES', 'SSI', 'derek.little@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 309-8056'),
  ('Josh', 'Polk', 'Estimator', 'SALES', 'SSI', 'josh.polk@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 592-3882'),
  ('Grant', 'Gardner', 'Production Manager', 'PRODUCTION', 'SSI', 'grant.gardner@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 309-9603'),
  ('Charlie', 'Bennett', 'Purchasing Manager', 'PURCHASING', 'SSI', 'charlie.bennett@specializedstructures.com', '(912) 534-6111', NULL, NULL, '(912) 381-2063'),
  ('Kenneth', 'Haskins', 'Purchasing Assistant', 'PURCHASING', 'SSI', 'kenneth.haskins@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('William', 'Peacock', 'Material Control', 'PURCHASING', 'SSI', 'william.peacock@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Silvanna', 'Corona', 'Project Coordinator', 'OPERATIONS', 'SSI', 'silvanna.corona@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Tyler', 'Ellis', 'Drafter', 'DRAFTING', 'SSI', 'tyler.ellis@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Gavin', 'Grantham', 'Drafter', 'DRAFTING', 'SSI', 'gavin.grantham@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Kevin', 'Gillespie', 'Service Manager', 'SERVICE', 'SSI', 'kevin.gillespie@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),
  ('Dudley', 'Vickers', 'Quality Control', 'QUALITY', 'SSI', 'dudley.vickers@specializedstructures.com', NULL, NULL, NULL, NULL),
  ('Jim', 'Harrell', 'Quality Control', 'QUALITY', 'SSI', 'jim.harrell@specializedstructures.com', '(912) 534-6111', NULL, NULL, NULL),

  -- ========================================================================
  -- WM-EAST - WHITLEY MANUFACTURING EAST (18 contacts)
  -- ========================================================================
  ('Joe', 'Dattoli', 'Plant General Manager', 'OPERATIONS', 'WM-EAST', 'joedattoli@whitleyman.com', '(717) 656-2081', '470', NULL, '(717) 826-1711'),
  ('Don', 'Engle', '(assisting new GM)', 'OPERATIONS', 'WM-EAST', 'donengle@whitleyman.com', '(717) 656-2081', NULL, NULL, '(717) 587-5252'),
  ('Tracy', 'Lagaza', 'Office Manager, QA Admin.', 'QUALITY', 'WM-EAST', 'tracylagaza@whitleyman.com', '(717) 656-2081', '400', NULL, '(717) 669-8422'),
  ('Kristin', 'Garber', 'HR', 'HR', 'WM-EAST', 'kristingarber@whitleyman.com', '(717) 656-2081', '430', NULL, '(610) 679-4548'),
  ('Christine', 'Kline', 'Sales/Estimating', 'SALES', 'WM-EAST', 'christinekline@whitleyman.com', '(717) 656-2081', '450', NULL, '(610) 223-0507'),
  ('Steve', 'Adams', 'Supervisor (plant 1)', 'PRODUCTION', 'WM-EAST', 'eastsupv@whitleyman.com', '(717) 656-2081', '481', NULL, '(717) 606-6753'),
  ('Mike', 'Greiner', 'Supervisor (plant 1)', 'PRODUCTION', 'WM-EAST', 'eastsupv@whitleyman.com', '(717) 656-2081', '481', NULL, '(717) 472-5150'),
  ('Sammy', 'Reyes-Ramos', 'Supervisor (plant 2)', 'PRODUCTION', 'WM-EAST', 'sammyramos@whitleyman.com', '(717) 656-2081', '487', NULL, '(717) 826-1528'),
  ('Ethan', 'Paul', 'Engineering/Design/IT', 'ENGINEERING', 'WM-EAST', 'ethanpaul@whitleyman.com', '(717) 656-2081', '440', NULL, '(570) 415-5358'),
  ('Blaine', 'Brillhart', 'Drafter', 'DRAFTING', 'WM-EAST', 'blainebrillhart@whitleyman.com', '(717) 656-2081', '441', NULL, '(717) 804-9100'),
  ('JC', 'Redmond', 'Project Manager', 'OPERATIONS', 'WM-EAST', 'jcredmond@whitleyman.com', '(717) 656-2081', '460', NULL, '(717) 875-3732'),
  ('Craig', 'Smith', 'Purchaser Manager', 'PURCHASING', 'WM-EAST', 'craigsmith@whitleyman.com', '(717) 656-2081', '421', NULL, '(717) 572-4596'),
  ('Robert', 'Frankfort', 'Purchaser', 'PURCHASING', 'WM-EAST', 'robertfrankfort@whitleyman.com', '(717) 656-2081', '420', NULL, '(223) 797-0202'),
  ('Bill', 'Stover', 'Receiving Manager', 'PURCHASING', 'WM-EAST', 'eastreceiving@whitleyman.com', '(717) 656-2081', '422', NULL, '(717) 209-1795'),
  ('Randy', 'Gibson', 'Maintenance Manager', 'SERVICE', 'WM-EAST', 'eastmaintenance@whitleyman.com', '(717) 656-2081', '482', NULL, '(717) 947-0316'),
  ('Kevin', 'Stauffer', 'QA Manager', 'QUALITY', 'WM-EAST', 'eastqa2@whitleyman.com', '(717) 656-2081', '412', NULL, '(610) 585-2881'),
  ('Dylan', 'Loper', 'Operations Manager', 'OPERATIONS', 'WM-EAST', 'dylanloper@whitleyman.com', '(717) 656-2081', '410', NULL, '(717) 881-2728'),
  ('Jose', 'Nogueras', 'Operations Manager', 'OPERATIONS', 'WM-EAST', 'josenogueras@whitleyman.com', '(717) 656-2081', '480', NULL, '(717) 327-7785'),

  -- ========================================================================
  -- WM-EVERGREEN - WHITLEY MANUFACTURING EVERGREEN (10 contacts)
  -- ========================================================================
  ('Randy', 'Maddox', 'Plant General Manager', 'OPERATIONS', 'WM-EVERGREEN', 'randymaddox@whitleyman.com', '(360) 653-5790', '23', NULL, NULL),
  ('Kali', 'Partridge', 'HR/Admin', 'HR', 'WM-EVERGREEN', 'kalipartridge@whitleyman.com', '(360) 653-5790', '10', NULL, NULL),
  ('Hank', 'Kennedy', 'Estimating', 'SALES', 'WM-EVERGREEN', 'hankkennedy@whitleyman.com', '(360) 653-5790', '18', NULL, NULL),
  ('Clint', 'Williams', 'Production Manager', 'PRODUCTION', 'WM-EVERGREEN', 'clintwilliams@whitleyman.com', '(360) 653-5790', '26', NULL, NULL),
  ('Walt', 'Hylback', 'Purchasing Manager', 'PURCHASING', 'WM-EVERGREEN', 'walthylback@whitleyman.com', '(360) 653-5790', '24', NULL, NULL),
  ('Alysha', 'Lantz', 'Accts Receivable/Purchasing', 'PURCHASING', 'WM-EVERGREEN', 'alyshalantz@whitleyman.com', '(360) 653-5790', '21', NULL, NULL),
  ('Mike', 'Perry', 'Design Manager', 'DRAFTING', 'WM-EVERGREEN', 'mikeperry@whitleyman.com', '(360) 653-5790', '22', NULL, NULL),
  ('Tina', 'Bach', 'Drafting Assistant', 'DRAFTING', 'WM-EVERGREEN', 'tinabach@whitleyman.com', '(360) 653-5790', '14', NULL, NULL),
  ('Nicole', 'Gruendl', 'Assistant Project Manager', 'OPERATIONS', 'WM-EVERGREEN', 'nicolegruendl@whitleyman.com', '(360) 653-5790', '19', NULL, NULL),
  ('Mike', 'Soley', 'QA/QC Manager', 'QUALITY', 'WM-EVERGREEN', 'mikesoley@whitleyman.com', '(360) 653-5790', '26', NULL, NULL),

  -- ========================================================================
  -- WM-SOUTH - WHITLEY MANUFACTURING SOUTH WHITLEY (26 contacts)
  -- ========================================================================
  ('Simon', 'Dragan', 'CEO', 'EXECUTIVE', 'WM-SOUTH', 'simondragan@whitleyman.com', '(260) 723-5131', '218', NULL, '(260) 450-0264'),
  ('Drew', 'Welborn', 'President', 'EXECUTIVE', 'WM-SOUTH', 'drewwelborn@whitleyman.com', '(260) 723-5131', '204', NULL, '(260) 450-5904'),
  ('Jeff', 'Zukowski', 'Continuous Improvement', 'OPERATIONS', 'WM-SOUTH', 'jeffzukowski@whitleyman.com', '(260) 723-5131', '221', NULL, '(331) 444-9513'),
  ('Bob', 'Jones', 'VP Finance', 'EXECUTIVE', 'WM-SOUTH', 'bobjones@whitleyman.com', '(260) 723-5131', '219', NULL, '(260) 750-2948'),
  ('Laurie', 'England', 'HR/Payroll', 'HR', 'WM-SOUTH', 'laurieengland@whitleyman.com', '(260) 723-5131', '203', NULL, '(260) 377-8292'),
  ('Stacey', 'Blain', 'Accounts Payable', 'ACCOUNTING', 'WM-SOUTH', 'staceyblain@whitleyman.com', '(260) 723-5131', '208', NULL, '(260) 213-9910'),
  ('Anne', 'Scarano', 'Receptionist/Accounts Payable', 'ACCOUNTING', 'WM-SOUTH', 'annescarano@whitleyman.com', '(260) 723-5131', '200', NULL, '(217) 779-8956'),
  ('William', 'Mann', 'VP Vertical Marketing', 'EXECUTIVE', 'WM-SOUTH', 'willmann@whitleyman.com', '(260) 723-5131', NULL, NULL, '(704) 719-0509'),
  ('Dan', 'Lipinski', 'Estimator', 'SALES', 'WM-SOUTH', 'danlipinski@whitleyman.com', '(260) 723-5131', '212', NULL, '(260) 409-9614'),
  ('Larry', 'High', 'Estimator', 'SALES', 'WM-SOUTH', 'larryhigh@whitleyman.com', '(260) 723-5131', '213', NULL, '(260) 602-0504'),
  ('Garett', 'Simmons', 'Estimator Project Mgr', 'SALES', 'WM-SOUTH', 'garettsimmons@whitleyman.com', '(260) 723-5131', '228', NULL, '(260) 229-6131'),
  ('Dan', 'Schuhler', 'Project Mgr/Estimator', 'SALES', 'WM-SOUTH', 'danschuhler@whitleyman.com', '(260) 723-5131', '283', NULL, '(260) 413-8950'),
  ('Don', 'Harlan', 'Plant Manager', 'OPERATIONS', 'WM-SOUTH', 'donharlan@whitleyman.com', '(260) 723-5131', '222', NULL, '(574) 527-0371'),
  ('Kevin', 'Henning', 'Supervisor A & B', 'PRODUCTION', 'WM-SOUTH', 'kevinhenning@whitleyman.com', '(260) 723-5131', '262', NULL, '(260) 312-1171'),
  ('Bryce', 'Bender', 'Supervisor C', 'PRODUCTION', 'WM-SOUTH', 'brycebender@whitleyman.com', '(260) 723-5131', '230', NULL, '(260) 530-6728'),
  ('Gage', 'Benson', 'Purchasing', 'PURCHASING', 'WM-SOUTH', 'gagebenson@whitleyman.com', '(260) 723-5131', '209', NULL, '(260) 409-5471'),
  ('Tim', 'Kelsey', 'Purchasing', 'PURCHASING', 'WM-SOUTH', 'timkelsey@whitleyman.com', '(260) 723-5131', '202', NULL, '(574) 930-6150'),
  ('Elena', 'Harris', 'QC/Purchasing', 'PURCHASING', 'WM-SOUTH', 'elenaharris@whitleyman.com', '(260) 723-5131', '227', NULL, '(260) 418-3262'),
  ('Adam', 'Parker', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'adamparker@whitleyman.com', '(260) 723-5131', '229', NULL, '(260) 503-1481'),
  ('Richard', 'Harlan', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'richardharlan@whitleyman.com', '(260) 723-5131', '225', NULL, '(260) 568-3214'),
  ('Anthony', 'Hedglen', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'anthonyhedglen@whitleyman.com', '(260) 723-5131', '281', NULL, '(574) 350-9096'),
  ('Rebecca', 'Martin', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'rebeccamartin@whitleyman.com', '(260) 723-5131', '282', NULL, '(260) 273-6132'),
  ('Kalah', 'Siler', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'kalahsiler@whitleyman.com', '(260) 723-5131', '224', NULL, '(360) 708-8667'),
  ('Taylor', 'Tullis', 'Drafting', 'DRAFTING', 'WM-SOUTH', 'taylortullis@whitleyman.com', '(260) 723-5131', NULL, NULL, '(513) 293-0541'),
  ('Crystal', 'Lee', 'Systems Coordinator', 'IT', 'WM-SOUTH', 'crystallee@whitleyman.com', '(260) 723-5131', '210', NULL, '(518) 419-8276'),
  ('Joshua', 'Rhodes', 'QC', 'QUALITY', 'WM-SOUTH', 'joshuarhodes@whitleyman.com', '(260) 723-5131', NULL, NULL, '(574) 248-9602'),

  -- ========================================================================
  -- WM-ROCHESTER - WHITLEY MANUFACTURING ROCHESTER (11 contacts)
  -- ========================================================================
  ('Kole', 'Kroft', 'Plant General Manager', 'OPERATIONS', 'WM-ROCHESTER', 'kolekroft@whitleyman.com', '(574) 223-4934', '109', NULL, '(219) 863-3733'),
  ('Kerry', 'Nelson', 'HR/Recruiting', 'HR', 'WM-ROCHESTER', 'kerrynelson@whitleyman.com', '(574) 223-4934', '106', NULL, '(574) 835-0602'),
  ('Beth', 'Balser', 'Receptionist/Admin.Asst.', 'OPERATIONS', 'WM-ROCHESTER', 'bethbalser@whitleyman.com', '(574) 223-4934', '101', NULL, '(574) 847-1352'),
  ('Rob', 'Farris', 'Production Manager P1', 'PRODUCTION', 'WM-ROCHESTER', 'robfarris@whitleyman.com', '(574) 223-4934', '108', NULL, '(574) 201-8691'),
  ('Jose', 'Jimenez', 'Production Manager P2', 'PRODUCTION', 'WM-ROCHESTER', 'josejimenez@whitleyman.com', '(574) 223-4934', '111', NULL, '(630) 915-0858'),
  ('Linda', 'Martin', 'Purchasing Manager', 'PURCHASING', 'WM-ROCHESTER', 'lindamartin@whitleyman.com', '(574) 223-4934', '128', NULL, '(574) 721-2592'),
  ('Ruth', 'Music', 'Purchasing Agent', 'PURCHASING', 'WM-ROCHESTER', 'ruthmusic@whitleyman.com', '(574) 223-4934', '105', NULL, '(260) 227-2295'),
  ('Lisa', 'Weissert', 'Systems Coordinator', 'IT', 'WM-ROCHESTER', 'lisaweissert@whitleyman.com', '(574) 223-4934', '107', NULL, '(574) 707-5844'),
  ('Benjamin', 'Wilson', 'Draftsman', 'DRAFTING', 'WM-ROCHESTER', 'benjaminwilson@whitleyman.com', '(574) 223-4934', '110', NULL, '(912) 492-8425'),
  ('Whitney', 'Farris', 'Quality Control Manager', 'QUALITY', 'WM-ROCHESTER', 'whitneyfarris@whitleyman.com', '(574) 223-4934', '102', NULL, '(574) 230-3891'),
  ('Vince', 'Mettler', 'Quality Control P2', 'QUALITY', 'WM-ROCHESTER', 'mbi.qc.plant2@whitleyman.com', '(574) 223-4934', '113', NULL, '(765) 469-2240')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Directory contacts imported:' AS status;
SELECT factory_code, COUNT(*) AS contacts
FROM directory_contacts
GROUP BY factory_code
ORDER BY factory_code;

SELECT 'Contacts by department:' AS status;
SELECT department_code, COUNT(*) AS contacts
FROM directory_contacts
GROUP BY department_code
ORDER BY COUNT(*) DESC;

SELECT 'Total contacts: ' || COUNT(*) AS total FROM directory_contacts;
