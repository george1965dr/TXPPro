-- Starter procedure list covering the codes referenced by
-- lib/dental/procedure-mapping.ts, so the odontogram's auto-generated
-- procedures resolve to a real fee out of the box. Adjust fees to match
-- the practice's actual schedule.

insert into procedures (ada_code, description, fee, tooth_required) values
  ('D1110', 'Prophylaxis (cleaning), adult', 120.00, false),
  ('D1351', 'Sealant, per tooth', 65.00, true),
  ('D2391', 'Resin-based composite, one surface, posterior', 185.00, true),
  ('D2392', 'Resin-based composite, two surfaces, posterior', 210.00, true),
  ('D2393', 'Resin-based composite, three surfaces, posterior', 245.00, true),
  ('D2394', 'Resin-based composite, four+ surfaces, posterior', 270.00, true),
  ('D2740', 'Crown, porcelain/ceramic', 1180.00, true),
  ('D7140', 'Extraction, erupted tooth', 280.00, true),
  ('D2962', 'Veneer, labial, porcelain/ceramic', 950.00, true),
  ('D2650', 'Inlay, porcelain/ceramic, 1-2 surfaces', 780.00, true),
  ('D2664', 'Onlay, porcelain/ceramic, 3+ surfaces', 920.00, true),
  ('D6010', 'Implant, surgical placement, endosteal', 2200.00, true),
  ('D6750', 'Bridge retainer crown, porcelain fused to metal', 1250.00, true),
  ('D6240', 'Bridge pontic, porcelain fused to metal', 1150.00, true),
  ('D3310', 'Root canal, anterior', 850.00, true),
  ('D3320', 'Root canal, premolar', 950.00, true),
  ('D3330', 'Root canal, molar', 1150.00, true),
  ('D3346', 'Root canal retreatment, anterior', 950.00, true),
  ('D3347', 'Root canal retreatment, premolar', 1050.00, true),
  ('D3348', 'Root canal retreatment, molar', 1250.00, true),
  ('D3410', 'Apicoectomy, anterior', 1050.00, true),
  ('D3421', 'Apicoectomy, premolar', 1100.00, true),
  ('D3425', 'Apicoectomy, molar', 1200.00, true),
  ('D6068', 'Implant-retained bridge retainer crown, porcelain/ceramic', 1450.00, true),
  ('D7953', 'Bone replacement graft', 650.00, true),
  ('D4273', 'Soft tissue graft', 850.00, true),
  ('D7951', 'Sinus augmentation (lift)', 1800.00, true),
  ('D7450', 'Removal of cyst', 620.00, true),
  ('D7286', 'Biopsy of oral tissue, soft', 320.00, true)
on conflict (ada_code) do nothing;
