
import React from 'react'
import { Link, Routes, Route } from 'react-router-dom'
export default function AdminLayout(){ return (<div className="grid grid-cols-12 gap-6"><aside className="col-span-3 card p-4"><nav><Link to="/admin">Dashboard</Link></nav></aside><main className="col-span-9">Admin content</main></div>) }
