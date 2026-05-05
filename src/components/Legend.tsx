import { categories } from '../data/categories';

export function Legend() {
  return (
    <div className="card">
      <h2>Category legend</h2>
      <p className="muted">Every method in the planner carries one or more of these chips.</p>
      <div className="legend-grid">
        {categories.map((c) => (
          <div className="legend-item" key={c.id}>
            <span className="emoji">{c.emoji}</span>
            <span className="text">
              <span className="label" style={{ color: `var(${c.colorVar})` }}>
                {c.label}
              </span>
              <span className="desc">{c.description}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
