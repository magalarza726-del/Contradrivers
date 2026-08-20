export const AAA={
  version:'0.8.0',
  target_fps:60,
  fixed_step:1/120,
  max_substeps:5,
  handling:{
    // Legacy closed-track runtime uses compressed authored coordinates.
    motion_scale:.28,
    steering_sign:-1,
    ride_height:.065,
    steering_gamma:1.45,
    countersteer_assist:.38,
    drift_min_kmh:72,
    handbrake_grip:.34,
    offroad_drag:.56,
    wall_scrub:.78
  },
  open_world:{
    extent_m:4000,
    area_km2:64,
    chunk_size_m:500,
    stream_radius_chunks:2,
    road_length_target_km:350,
    traffic_pool:56,
    activities:12,
    scale:'1 world unit = 1 metre'
  },
  camera:{
    base_fov:64,
    max_fov:82,
    look_ahead:8.5,
    speed_pullback:3.8,
    roll_max_deg:3.2,
    shake_decay:7.5
  },
  traffic:{
    pool:30,
    spawn_min:12,
    spawn_max:24,
    near_miss_m:2.2,
    checkable_mass:1900,
    head_on_damage:34
  },
  pursuit:{
    heat_decay:.045,
    heat_speed_gain:.045,
    heat_aggression_gain:.12,
    roadblock_heat:.58,
    rhino_heat:.82
  },
  level_beats:{min_seconds:8,max_seconds:24,rest_after_intensity:1},
  performance:{pixel_ratio_cap:1.75,max_buildings:180,max_lights:42,lod_far:260},
  track_profiles:{
    inversion_circuit:{theme:'CINEMATIC HILLS',districts:['downtown','hills','waterfront'],traffic:.52,police:.48,aggression:.52,stunt:.72},
    rockfall_pursuit:{theme:'REVENGE RING',districts:['ring road','industrial','stadium'],traffic:.82,police:.76,aggression:.84,stunt:.58},
    eclipse_bay_interchange:{theme:'HIGHWAY BATTLE',districts:['interstate','port','interchange'],traffic:.72,police:.86,aggression:.74,stunt:.54}
  }
};