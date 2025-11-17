-- Seed data for Smart Invoice application

-- Insert sample users
INSERT INTO public.users (id, email, name, company) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'demo@smartinvoice.com', 'Demo User', 'Smart Invoice Demo'),
('550e8400-e29b-41d4-a716-446655440001', 'john@acme.com', 'John Smith', 'Acme Corp');

-- Insert sample clients
INSERT INTO public.clients (user_id, name, email, company, phone) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'ABC Corp', 'billing@abc.com', 'ABC Corporation', '+27 21 123 4567'),
('550e8400-e29b-41d4-a716-446655440000', 'XYZ Ltd', 'accounts@xyz.com', 'XYZ Limited', '+27 21 987 6543'),
('550e8400-e29b-41d4-a716-446655440000', 'Tech Solutions Inc', 'info@techsolutions.com', 'Tech Solutions', '+27 21 555 1234'),
('550e8400-e29b-41d4-a716-446655440000', 'Global Services', 'admin@globalservices.com', 'Global Services Ltd', '+27 21 777 8888');

-- Insert sample invoices
INSERT INTO public.invoices (invoice_number, user_id, client_name, client_email, items, total, status, due_date, description) VALUES
('INV00001', '550e8400-e29b-41d4-a716-446655440000', 'ABC Corp', 'billing@abc.com',
 '[{"description": "Web development services", "quantity": 1, "price": 1500.00}]',
 1500.00, 'paid', NOW() + INTERVAL '30 days', 'Website development project'),

('INV00002', '550e8400-e29b-41d4-a716-446655440000', 'XYZ Ltd', 'accounts@xyz.com',
 '[{"description": "Consulting services - Phase 1", "quantity": 1, "price": 1500.00}, {"description": "Consulting services - Phase 2", "quantity": 1, "price": 1000.00}]',
 2500.00, 'sent', NOW() + INTERVAL '15 days', 'Business consulting project'),

('INV00003', '550e8400-e29b-41d4-a716-446655440000', 'Tech Solutions Inc', 'info@techsolutions.com',
 '[{"description": "Software development", "quantity": 40, "price": 75.00}]',
 3000.00, 'sent', NOW() + INTERVAL '7 days', 'Custom software development');

-- Insert sample quotes
INSERT INTO public.quotes (user_id, client_name, client_email, items, total, status, valid_until, description) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'ABC Corp', 'billing@abc.com',
 '[{"description": "Mobile app development", "quantity": 1, "price": 5000.00}]',
 5000.00, 'sent', NOW() + INTERVAL '30 days', 'iOS and Android mobile application'),

('550e8400-e29b-41d4-a716-446655440000', 'Global Services', 'admin@globalservices.com',
 '[{"description": "System integration", "quantity": 1, "price": 3500.00}, {"description": "Training and support", "quantity": 20, "price": 150.00}]',
 6500.00, 'accepted', NOW() + INTERVAL '45 days', 'ERP system integration project');

-- Insert sample expenses
INSERT INTO public.expenses (user_id, vendor, invoice_number, description, quantity, amount, category, date, vat_included) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'DNS Supplies', 'EXP001', 'Office stationery', 1, 250.00, 'Office Supplies', CURRENT_DATE - INTERVAL '5 days', true),
('550e8400-e29b-41d4-a716-446655440000', 'Tech Solutions Inc', 'EXP002', 'Software license', 1, 1200.00, 'Software & Tools', CURRENT_DATE - INTERVAL '10 days', true),
('550e8400-e29b-41d4-a716-446655440000', 'Uber', 'EXP003', 'Client meeting transport', 1, 150.00, 'Travel', CURRENT_DATE - INTERVAL '3 days', true),
('550e8400-e29b-41d4-a716-446655440000', 'Starbucks', 'EXP004', 'Business lunch with client', 3, 225.00, 'Meals & Entertainment', CURRENT_DATE - INTERVAL '7 days', true),
('550e8400-e29b-41d4-a716-446655440000', 'Office Depot', 'EXP005', 'Computer equipment', 1, 3500.00, 'Equipment', CURRENT_DATE - INTERVAL '15 days', true);